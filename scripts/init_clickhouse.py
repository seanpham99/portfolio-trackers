import clickhouse_connect
import os

CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "clickhouse-server")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", 8123))
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "")


def init_db():
    print(
        f"Connecting to ClickHouse at {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT} as {CLICKHOUSE_USER}"
    )
    try:
        client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
        )
    except Exception as e:
        print(f"Failed to connect to ClickHouse: {e}")
        raise

    # 1. Create Database
    client.command("CREATE DATABASE IF NOT EXISTS market_dwh")

    # 2. Fact Table: Daily Price History
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.fact_stock_daily (
        ticker String,
        trading_date Date,
        open Float64,
        high Float64,
        low Float64,
        close Float64,
        volume UInt64,
        -- ENRICHED COLUMNS (Calculated by you)
        ma_50 Float64 DEFAULT 0,
        ma_200 Float64 DEFAULT 0,
        rsi_14 Float64 DEFAULT 0,
        daily_return Float64 DEFAULT 0,
        source String DEFAULT 'vnstock',
        ingested_at DateTime DEFAULT now()
    ) 
    ENGINE = ReplacingMergeTree(ingested_at)
    ORDER BY (ticker, trading_date)
    """)

    # 3. Fact Table: Financial Ratios (Quarterly)
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.fact_financial_ratios (
        ticker String,
        fiscal_date Date,
        year UInt16,
        quarter UInt8,
        pe_ratio Float64,
        pb_ratio Float64,
        roe Float64,
        net_profit_margin Float64,
        debt_to_equity Float64
    )
    ENGINE = ReplacingMergeTree()
    ORDER BY (ticker, year, quarter)
    """)

    # 4. Dimension Table: Stock Companies
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.dim_stock_companies (
        symbol String,
        organ_name String,
        exchange String,
        ingested_at DateTime DEFAULT now()
    )
    ENGINE = ReplacingMergeTree(ingested_at)
    ORDER BY symbol
    """)

    # 5. Fact Table: Dividends
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.fact_dividends (
        ticker String,
        exercise_date Date,
        cash_year UInt16,
        cash_dividend_percentage Float64,
        stock_dividend_percentage Float64,
        issue_method String,
        ingested_at DateTime DEFAULT now()
    )
    ENGINE = ReplacingMergeTree(ingested_at)
    ORDER BY (ticker, exercise_date)
    """)

    # 6. Fact Table: Income Statement (Key Metrics)
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.fact_income_statement (
        ticker String,
        fiscal_date Date,
        year UInt16,
        quarter UInt8,
        revenue Float64,
        cost_of_goods_sold Float64,
        gross_profit Float64,
        operating_profit Float64,
        net_profit_post_tax Float64,
        ingested_at DateTime DEFAULT now()
    )
    ENGINE = ReplacingMergeTree(ingested_at)
    ORDER BY (ticker, year, quarter)
    """)

    # 7. Fact Table: News
    client.command("""
    CREATE TABLE IF NOT EXISTS market_dwh.fact_news (
        ticker String,
        publish_date DateTime,
        title String,
        source String,
        price_at_publish Float64,
        price_change Float64,
        price_change_ratio Float64,
        rsi Float64,
        rs Float64,
        news_id UInt64,
        ingested_at DateTime DEFAULT now()
    )
    ENGINE = ReplacingMergeTree(ingested_at)
    ORDER BY (ticker, publish_date, news_id)
    """)

    print("ClickHouse Schema Initialized.")

    # 5. Enrich Data: Fetch Company List from vnstock
    print("Fetching company list from vnstock...")
    try:
        import sys

        # Ensure project root is in path
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from scripts.manual_load_data import update_company_dimension

        update_company_dimension(client)

    except Exception as e:
        print(f"Failed to fetch or insert company data: {e}")
        # We don't raise here to allow the script to complete schema init even if fetch fails
        pass

    # 6. Load Initial Data (5 Years)
    print("Loading 5 years of historical data...")
    try:
        # Import here to avoid issues if dependencies aren't met during top-level import
        # Ensure sys.path is set correctly for imports in manual_load_data
        import sys

        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        from scripts.manual_load_data import manual_load
        from datetime import datetime, timedelta

        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=5 * 365)).strftime("%Y-%m-%d")

        # Call manual_load
        manual_load(start_date, end_date)
        print("Historical data loaded.")
    except Exception as e:
        print(f"Failed to load historical data: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    init_db()
