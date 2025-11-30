import yfinance as yf
import pandas as pd
import pandas_ta as ta
import logging

# Try to import vnstock, if fails, we will rely on yfinance
try:
    from vnstock import Quote, Finance, Company

    VNSTOCK_AVAILABLE = True
except ImportError:
    logging.warning(
        "Could not import 'Quote', 'Finance', or 'Company' from 'vnstock'. Will use yfinance as fallback where possible."
    )
    VNSTOCK_AVAILABLE = False


def fetch_stock_price(symbol, start_date, end_date):
    """
    Tries to fetch from VNSTOCK (using Quote API). If fails/empty, falls back to YFINANCE.
    Returns: Standardized DataFrame for ClickHouse.
    """
    logging.info(f"Attempting fetch for {symbol}...")

    df = pd.DataFrame()

    # 1. Try Primary Source (vnstock)
    if VNSTOCK_AVAILABLE:
        try:
            logging.info(f"Fetching {symbol} via VNSTOCK (Quote API)...")
            # vnstock Quote API usage
            quote = Quote(symbol=symbol, source="vci")
            df = quote.history(start=start_date, end=end_date, interval="D")

            if df is None or df.empty:
                raise ValueError("Empty data from vnstock")

            # Normalize Columns
            # vnstock Quote.history usually returns: time, open, high, low, close, volume, ticker (or similar)
            # We need to inspect the columns if possible, but let's assume standard names or map them
            df.columns = [c.lower() for c in df.columns]

            rename_map = {"time": "trading_date", "date": "trading_date"}
            df.rename(columns=rename_map, inplace=True)

            # Ensure required columns exist
            required_cols = ["trading_date", "open", "high", "low", "close", "volume"]
            if not all(col in df.columns for col in required_cols):
                logging.warning(f"vnstock data missing columns: {df.columns}")
                raise ValueError("Invalid columns from vnstock")

            df = df[required_cols]
            df["ticker"] = symbol
            df["source"] = "vnstock"

        except Exception as e:
            logging.warning(
                f"VNSTOCK failed for {symbol} ({e}). Falling back to YFINANCE..."
            )
            df = pd.DataFrame()  # Reset

    # 2. Fallback Source (yfinance)
    if df.empty:
        # Note: yfinance needs '.VN' suffix for Vietnamese stocks
        yf_symbol = f"{symbol}.VN" if not symbol.endswith(".VN") else symbol
        logging.info(f"Fetching {yf_symbol} via YFINANCE...")

        try:
            df_yf = yf.download(
                yf_symbol, start=start_date, end=end_date, progress=False
            )

            if df_yf.empty:
                logging.error(f"YFINANCE also failed for {symbol}.")
                return pd.DataFrame()  # Return empty if both fail

            df_yf.reset_index(inplace=True)

            # Normalize Columns (yfinance uses Title Case)
            df_yf["ticker"] = symbol
            df_yf["source"] = "yfinance"
            df_yf.rename(
                columns={
                    "Date": "trading_date",
                    "Open": "open",
                    "High": "high",
                    "Low": "low",
                    "Close": "close",
                    "Volume": "volume",
                },
                inplace=True,
            )

            # Flatten MultiIndex columns if present (yfinance update)
            if isinstance(df_yf.columns, pd.MultiIndex):
                df_yf.columns = df_yf.columns.get_level_values(0)

            # Ensure columns exist after rename
            required_cols = [
                "trading_date",
                "open",
                "high",
                "low",
                "close",
                "volume",
                "ticker",
                "source",
            ]
            # Check if rename worked (sometimes yfinance returns different casing)
            df_yf.columns = [c.lower() for c in df_yf.columns]
            # Remap back to expected
            col_map = {"date": "trading_date"}
            df_yf.rename(columns=col_map, inplace=True)

            # Filter
            available_cols = [c for c in required_cols if c in df_yf.columns]
            if len(available_cols) < len(required_cols):
                logging.error(f"Missing columns in yfinance data: {df_yf.columns}")
                return pd.DataFrame()

            df = df_yf[required_cols]

        except Exception as yf_e:
            logging.error(f"YFINANCE exception for {symbol}: {yf_e}")
            return pd.DataFrame()

    # 3. Final Type Conversion for ClickHouse
    if df.empty:
        return df

    # Ensure trading_date is date object
    if not pd.api.types.is_datetime64_any_dtype(df["trading_date"]):
        df["trading_date"] = pd.to_datetime(df["trading_date"])

    df["trading_date"] = df["trading_date"].dt.date
    df[["open", "high", "low", "close"]] = df[["open", "high", "low", "close"]].astype(
        float
    )
    df["volume"] = df["volume"].astype(int)

    # 3. ENRICHMENT STEP (The "Pro" Way)
    if not df.empty:
        # 1. Setup: pandas_ta prefers a DatetimeIndex
        df["trading_date"] = pd.to_datetime(df["trading_date"])
        df.set_index("trading_date", inplace=True)
        df.sort_index(inplace=True)

        # 2. Calculate Indicators (Using pandas_ta for everything)
        try:
            df["ma_50"] = ta.sma(df["close"], length=50)
            df["ma_200"] = ta.sma(df["close"], length=200)
            df["rsi_14"] = ta.rsi(df["close"], length=14)
            df["daily_return"] = df["close"].pct_change() * 100
        except Exception as e:
            logging.error(f"Error calculating indicators: {e}")

        # 3. Handling Missing Data (Crucial for Dashboard Visuals)
        # Don't fill MA with 0! It looks like a price crash.
        # Strategy: Backfill the first available MA to the start, or leave NaN.
        # For this DWH, let's backfill so the line looks continuous.
        df["ma_50"] = df["ma_50"].bfill()
        df["ma_200"] = df["ma_200"].bfill()
        df["rsi_14"] = df["rsi_14"].bfill()

        # 4. Cleanup: Reset index so 'trading_date' is a column again for ClickHouse
        df.reset_index(inplace=True)
        df["trading_date"] = df["trading_date"].dt.date

        # Fill remaining technical NaNs (if any) with 0 only as a last resort
        cols_to_fix = ["ma_50", "ma_200", "rsi_14", "daily_return"]
        df[cols_to_fix] = df[cols_to_fix].fillna(0)

    return df


def fetch_financial_ratios(symbol):
    """
    Fetches financial ratios using vnstock Finance API.
    Returns DataFrame with columns: ticker, fiscal_date, year, quarter, pe_ratio, pb_ratio, roe, net_profit_margin, debt_to_equity
    """
    if not VNSTOCK_AVAILABLE:
        logging.warning("VNSTOCK not available, skipping financial ratios.")
        return pd.DataFrame()

    logging.info(f"Fetching financial ratios for {symbol}...")
    try:
        finance = Finance(symbol=symbol, source="VCI")
        # Fetch quarterly ratios
        df = finance.ratio(report_range="quarterly", lang="en")

        if df is None or df.empty:
            logging.warning(f"No financial ratios found for {symbol}")
            return pd.DataFrame()

        # Log columns for debugging
        print(f"Ratio columns for {symbol}: {df.columns.tolist()}")

        # Flatten MultiIndex if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = ["_".join(map(str, col)).strip() for col in df.columns.values]
            print(f"Flattened columns: {df.columns.tolist()}")

        # Helper to find column case-insensitive
        def get_col(name, candidates):
            for c in candidates:
                if name.lower() in str(c).lower():
                    return c
            return None

        cols = df.columns.tolist()

        # Create a standardized DataFrame
        out_df = pd.DataFrame()
        out_df["ticker"] = [symbol] * len(df)

        # Safely get year and quarter
        year_col = get_col("yearReport", cols)
        quarter_col = get_col("lengthReport", cols)  # or fiscalDate

        if year_col:
            out_df["year"] = df[year_col].astype(int)
        else:
            logging.warning(f"'yearReport' column missing for {symbol}")
            out_df["year"] = 0

        if quarter_col:
            out_df["quarter"] = df[quarter_col].astype(int)
        else:
            logging.warning(f"'lengthReport' column missing for {symbol}")
            out_df["quarter"] = 0

        pe_col = get_col("P/E", cols) or get_col("Price to Earning", cols)
        pb_col = get_col("P/B", cols) or get_col("Price to Book", cols)
        roe_col = get_col("ROE", cols)
        npm_col = get_col("Net Profit Margin", cols) or get_col("Net Margin", cols)

        out_df["pe_ratio"] = df[pe_col] if pe_col else 0.0
        out_df["pb_ratio"] = df[pb_col] if pb_col else 0.0
        out_df["roe"] = df[roe_col] if roe_col else 0.0
        out_df["net_profit_margin"] = df[npm_col] if npm_col else 0.0

        # Construct fiscal_date (end of quarter)
        def get_quarter_end(row):
            y = row["year"]
            q = row["quarter"]
            if q == 1:
                return pd.Timestamp(f"{y}-03-31").date()
            elif q == 2:
                return pd.Timestamp(f"{y}-06-30").date()
            elif q == 3:
                return pd.Timestamp(f"{y}-09-30").date()
            elif q == 4:
                return pd.Timestamp(f"{y}-12-31").date()
            return pd.Timestamp(f"{y}-01-01").date()  # Fallback

        out_df["fiscal_date"] = out_df.apply(get_quarter_end, axis=1)

        # Debt to Equity needs Balance Sheet usually, but maybe in ratios?
        out_df["debt_to_equity"] = 0.0  # Will fill from Balance Sheet or if found here

        return out_df

    except Exception as e:
        logging.error(f"Error fetching ratios for {symbol}: {e}")
        return pd.DataFrame()


def fetch_balance_sheet(symbol):
    """
    Fetches balance sheet to calculate Debt/Equity if needed, or other metrics.
    """
    if not VNSTOCK_AVAILABLE:
        return pd.DataFrame()

    try:
        finance = Finance(symbol=symbol, source="VCI")
        df = finance.balance_sheet(period="quarter", lang="en")
        # Logic to extract Debt and Equity
        return df
    except Exception as e:
        logging.error(f"Error fetching BS for {symbol}: {e}")
        return pd.DataFrame()


def fetch_dividends(symbol):
    if not VNSTOCK_AVAILABLE:
        return pd.DataFrame()

    try:
        # Use Company class
        company = Company(symbol=symbol, source="TCBS")

        try:
            df = company.dividends()
        except AttributeError:
            logging.warning(f"company.dividends not found for {symbol}")
            return pd.DataFrame()

        if df is None or df.empty:
            return pd.DataFrame()

        # Columns from API: exercise_date, cash_year, cash_dividend_percentage, issue_method
        # ClickHouse expects: ticker, exercise_date, cash_year, cash_dividend_percentage, stock_dividend_percentage, issue_method

        df["ticker"] = symbol

        # Ensure correct types
        if "exercise_date" in df.columns:
            df["exercise_date"] = pd.to_datetime(df["exercise_date"]).dt.date

        if "cash_year" in df.columns:
            df["cash_year"] = df["cash_year"].astype(int)

        if "cash_dividend_percentage" in df.columns:
            df["cash_dividend_percentage"] = df["cash_dividend_percentage"].astype(
                float
            )

        # Add missing columns expected by ClickHouse
        if "stock_dividend_percentage" not in df.columns:
            df["stock_dividend_percentage"] = 0.0

        required_cols = [
            "ticker",
            "exercise_date",
            "cash_year",
            "cash_dividend_percentage",
            "stock_dividend_percentage",
            "issue_method",
        ]

        # Ensure all required columns exist
        for col in required_cols:
            if col not in df.columns:
                df[col] = None

        return df[required_cols]

    except Exception as e:
        logging.warning(f"Error fetching dividends for {symbol}: {e}")
        return pd.DataFrame()


def fetch_income_stmt(symbol):
    if not VNSTOCK_AVAILABLE:
        return pd.DataFrame()

    try:
        # Use Finance class
        finance = Finance(symbol=symbol, source="VCI")

        # Fetch data with confirmed parameters
        try:
            df = finance.income_statement(period="quarter", lang="en", dropna=True)
        except AttributeError:
            logging.warning(f"finance.income_statement not found for {symbol}")
            return pd.DataFrame()

        if df is None or df.empty:
            return pd.DataFrame()

        # The data is returned with periods as rows and metrics as columns.
        # Columns include: ticker, yearReport, lengthReport, Net Sales, Cost of Sales, etc.

        # Standardize columns
        # Map specific columns to our schema
        mapping = {
            "Net Sales": "revenue",
            "Cost of Sales": "cost_of_goods_sold",
            "Gross Profit": "gross_profit",
            "Operating Profit/Loss": "operating_profit",
            "Net Profit For the Year": "net_profit_post_tax",
        }

        # Rename columns
        df.rename(columns=mapping, inplace=True)

        # Select required columns
        required_metrics = [
            "revenue",
            "cost_of_goods_sold",
            "gross_profit",
            "operating_profit",
            "net_profit_post_tax",
        ]

        # Check if required columns exist
        available_metrics = [m for m in required_metrics if m in df.columns]

        if not available_metrics:
            logging.warning(
                f"No matching metrics found for {symbol} in income statement"
            )
            return pd.DataFrame()

        df_final = df.copy()

        # Ensure ticker is present (it usually is, but just in case)
        if "ticker" not in df_final.columns:
            df_final["ticker"] = symbol

        # Parse period from yearReport and lengthReport
        if "yearReport" in df_final.columns and "lengthReport" in df_final.columns:
            df_final["year"] = df_final["yearReport"]
            df_final["quarter"] = df_final["lengthReport"]

            # Construct fiscal_date
            def make_date(row):
                try:
                    y = int(row["year"])
                    q = int(row["quarter"])
                    if q == 1:
                        return f"{y}-03-31"
                    if q == 2:
                        return f"{y}-06-30"
                    if q == 3:
                        return f"{y}-09-30"
                    if q == 4:
                        return f"{y}-12-31"
                except (ValueError, TypeError):
                    pass
                return None

            df_final["fiscal_date"] = df_final.apply(make_date, axis=1)
        df_final.dropna(subset=["year", "quarter", "fiscal_date"], inplace=True)

        final_cols = ["ticker", "fiscal_date", "year", "quarter"] + available_metrics

        # Ensure all required metrics exist (fill with 0 or None if missing, though we checked available_metrics)
        for col in required_metrics:
            if col not in df_final.columns:
                df_final[col] = None

        return df_final[final_cols]

    except Exception as e:
        logging.warning(f"Error fetching income stmt for {symbol}: {e}")
        return pd.DataFrame()


def fetch_news(symbol):
    if not VNSTOCK_AVAILABLE:
        return pd.DataFrame()

    try:
        # Use Company class
        company = Company(symbol=symbol, source="TCBS")

        # usage: company.news(page_size=50)
        # Note: Check if method is 'news' or 'company_news'
        try:
            df = company.news(page_size=50)
        except AttributeError:
            logging.warning(f"company.news not found for {symbol}")
            return pd.DataFrame()

        if df is None or df.empty:
            return pd.DataFrame()

        # Standardize columns
        df["ticker"] = symbol

        # Map columns
        # id -> news_id
        # publish_date -> publish_date (ensure datetime)
        # price -> price_at_publish

        df.rename(columns={"id": "news_id", "price": "price_at_publish"}, inplace=True)

        # Ensure publish_date is datetime
        if "publish_date" in df.columns:
            df["publish_date"] = pd.to_datetime(df["publish_date"])

        # Select columns
        required_cols = [
            "ticker",
            "publish_date",
            "title",
            "source",
            "price_at_publish",
            "price_change",
            "price_change_ratio",
            "rsi",
            "rs",
            "news_id",
        ]

        # Fill missing
        for col in required_cols:
            if col not in df.columns:
                df[col] = None

        # Ensure types
        df["news_id"] = df["news_id"].astype(int)
        df["price_at_publish"] = df["price_at_publish"].astype(float)
        df["price_change"] = df["price_change"].astype(float)
        df["price_change_ratio"] = df["price_change_ratio"].astype(float)
        df["rsi"] = df["rsi"].astype(float)
        df["rs"] = df["rs"].astype(float)

        return df[required_cols]
    except Exception as e:
        logging.warning(f"Error fetching news for {symbol}: {e}")
        return pd.DataFrame()
