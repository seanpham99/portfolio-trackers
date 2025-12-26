---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  [
    "market-vietnam-portfolio-tracking-research-2025-12-26.md",
    "domain-portfolio-calculations-analytics-2025-12-26.md",
  ]
workflowType: "research"
lastStep: 6
research_type: "domain"
research_topic: "Market microstructure: brokerage APIs, data normalization, corporate actions, real-time data protocols"
research_goals: "Understand brokerage integration standards (FIX, REST, WebSocket), multi-asset data normalization, corporate action workflows, real-time vs delayed data strategies for building robust portfolio tracking across US and Vietnamese markets"
user_name: "Son"
date: "2025-12-26"
web_research_enabled: true
source_verification: true
completed: true
---

# Domain Research: Market Microstructure & Data Integration

**Date:** 2025-12-26
**Author:** Son
**Research Type:** domain
**Focus:** Brokerage API Integration, Data Normalization, Corporate Actions, Real-Time Data Protocols

---

## Research Overview

This domain research examines the technical infrastructure and protocols required for integrating with brokerage platforms, normalizing multi-asset market data, and handling corporate actions. The analysis covers:

- **Brokerage API standards**: FIX protocol, REST APIs, WebSocket feeds for real-time data
- **Multi-asset data normalization**: Equities, crypto, commodities, forex data harmonization
- **Corporate actions handling**: Dividends, stock splits, mergers, spinoffs, rights issues
- **Real-time data strategies**: Streaming protocols, throttling, delayed vs real-time data economics

**Key Questions:**

1. How to integrate with Vietnamese brokerages (SSI, VPS, VCBS)?
2. What's the optimal real-time vs delayed data strategy for MVP?
3. How to automate corporate action adjustments for accurate portfolio tracking?
4. Which API standards should we prioritize (FIX vs REST vs WebSocket)?

**Architectural Implications:**

- Data pipeline design (batch vs streaming)
- Third-party vendor selection (market data providers)
- Cost structure (real-time data fees)
- API integration complexity and maintenance burden

---

## 1. Brokerage API Standards: FIX, REST, WebSocket

### FIX Protocol (Financial Information eXchange)

**History & Purpose:**

- Originated 1992 between Fidelity Investments and Salomon Brothers
- Became **de facto standard for pre-trade, trade, and post-trade communication** in equity markets
- Now maintained by FIX Trading Community (non-profit, 300+ member firms including major investment banks)
- Expanding beyond equities: FX, fixed income, derivatives, commodities

**Technical Specifications:**

- **Message Encoding Options:**
  - **Tagvalue (Classic FIX)**: ASCII-based, human-readable, tag=value pairs separated by SOH (0x01)
    - Example: `8=FIX.4.2 | 9=178 | 35=8 | 49=PHLX | 56=PERS | 55=MSFT | 54=1 | 38=15 | 44=15 | 10=128`
    - Fields: BeginString (8), BodyLength (9), MsgType (35), SecurityID (55), Side (54), Quantity (38), Price (44), Checksum (10)
  - **FIXML**: XML representation for back-office/clearing (better for parsing, lower performance)
  - **Simple Binary Encoding (SBE)**: High-performance binary format for low-latency trading (deterministic performance, not self-describing)
  - **Alternative Encodings**: JSON, Google Protocol Buffers, ASN.1

- **Session Protocols:**
  - **FIXT (FIX Transport)**: Point-to-point over TCP, guaranteed message delivery, sequence numbers, retransmission on disconnect
  - **FIXP (FIX Performance)**: Low-latency variant with configurable delivery guarantees:
    - **Recoverable**: Exactly-once delivery (retransmission on gaps)
    - **Idempotent**: At-most-once delivery (no recovery, application handles gaps)
    - **Unsequenced**: No guarantees (for latency-sensitive cases)
  - **FAST Protocol** (2005): Binary protocol for multicast market data streaming via UDP

**Use Cases:**

- **Front-office trading**: Order placement, execution reports, indications of interest (IOI)
- **Institutional trading**: Buy-side (mutual funds, investment managers) ↔ sell-side (brokers/dealers)
- **Exchange connectivity**: Stock exchanges, ECNs, dark pools
- **Multi-asset support**: Equities, bonds, FX, derivatives
- **Algorithmic trading**: FIXatdl (FIX Algorithmic Trading Definition Language)

**Pros:**

- **Industry standard**: Universal adoption, interoperability across 300+ financial institutions
- **Mature ecosystem**: Libraries, tools, documentation for most languages
- **Comprehensive coverage**: Supports full trade lifecycle (pre-trade → trade → post-trade)
- **Multi-asset**: Equities, FX, fixed income, derivatives

**Cons:**

- **Complexity**: Steep learning curve, verbose specification, requires dedicated FIX engine
- **Latency**: Tagvalue encoding slower than binary formats (SBE addresses this)
- **Maintenance burden**: Session management, sequence recovery, heartbeat logic
- **Overkill for portfolio tracking**: Designed for order execution, not portfolio aggregation
- **Cost**: Enterprise-grade FIX connections often require vendor fees (Bloomberg, Refinitiv)

**Vietnamese Broker Applicability:**

- **SSI Securities**: No publicly documented FIX API for retail portfolio tracking (iBoard platform is proprietary web/mobile app)
- **VPS Securities**: No publicly documented FIX API for retail customers
- **VCBS**: No publicly documented FIX API
- **Reality**: Vietnamese brokerages use FIX for institutional clients and exchange connectivity, but **do not expose FIX APIs to retail developers**

**Verdict for Fin-Sight:**

- **Not recommended for MVP**: Overkill for portfolio tracking, high complexity, no Vietnamese broker FIX access
- **Future consideration**: If targeting institutional clients or building order execution features

---

### REST APIs (Representational State Transfer)

**Technical Characteristics:**

- **HTTP-based**: Uses standard HTTP verbs (GET, POST, PUT, DELETE)
- **Request-response model**: Client initiates request, server responds with data (synchronous)
- **Stateless**: Each request independent, no session persistence (authentication via tokens)
- **Data formats**: JSON (most common), XML
- **Rate limiting**: APIs enforce request limits (e.g., 100 requests/minute, 10,000/day)

**Common Patterns for Brokerage/Market Data:**

- **Authentication**: OAuth 2.0, API keys, JWT tokens
- **Endpoints**:
  - `/accounts` - List user brokerage accounts
  - `/positions` - Current holdings
  - `/transactions` - Trade history
  - `/quotes/{symbol}` - Latest price for symbol
  - `/historical/{symbol}` - OHLCV bars (daily, hourly)
- **Pagination**: Large datasets returned in pages (e.g., 100 transactions per page)
- **Throttling**: 429 Too Many Requests when rate limit exceeded
- **Webhooks**: Server pushes events to client URL (e.g., trade execution, price alerts)

**Market Data Providers (US):**

- **Polygon.io**: Real-time/delayed stock, options, forex, crypto; $199/month (delayed), $399/month (real-time)
- **Alpha Vantage**: Free tier (25 requests/day), premium tiers for more
- **IEX Cloud**: Real-time US equities, $9/month (limited), enterprise pricing for heavy usage
- **Yahoo Finance API (Unofficial)**: Free, delayed data, fragile (no official support, can break)
- **Finnhub**: Free tier (60 requests/minute), premium real-time ($99/month+)

**Crypto Data:**

- **Binance API**: Free real-time price data, WebSocket support, rate limits (1200 requests/minute)
- **Coinbase Pro API**: Free real-time, WebSocket support
- **CoinGecko**: Free API for crypto prices, market cap, historical data

**Vietnamese Stock Data:**

- **vnstock (Python library)**: Free, scrapes SSI data, no official API but functional
- **SSI iBoard (Unofficial)**: No documented public API; mobile apps use proprietary endpoints
- **VPS/VCBS**: No public APIs documented for retail developers
- **Potential**: Vietnamese brokerages may provide APIs to institutional partners (not public)

**Pros:**

- **Simple**: Easy to implement, standard HTTP, JSON responses
- **Widely supported**: Every language has HTTP client libraries
- **Flexible**: Paginate, filter, sort data easily
- **Cacheable**: HTTP caching headers reduce redundant requests
- **Suitable for portfolio tracking**: Historical transactions, EOD prices, account balances

**Cons:**

- **Not real-time**: Request-response model has latency (100ms+ per request)
- **Polling inefficiency**: Must repeatedly request to check for updates (wastes bandwidth, hits rate limits)
- **Rate limits**: Aggressive polling quickly exhausts quotas
- **Stateless overhead**: Every request includes authentication headers

**Vietnamese Broker Applicability:**

- **SSI/VPS/VCBS**: No publicly documented REST APIs for retail portfolio data
- **Workaround**: CSV export from broker platforms → manual import to Fin-Sight (MVP strategy)
- **vnstock**: Leverages SSI data for stock prices/fundamentals (not brokerage holdings)

**Verdict for Fin-Sight:**

- **Use for market data**: Polygon.io (US stocks), Binance API (crypto), vnstock (VN stocks)
- **Use for US brokers**: Plaid API (aggregates US brokerages), Alpaca API (commission-free trading platform with API)
- **Not viable for Vietnamese brokerages** (yet): No public APIs; use CSV import for MVP

---

### WebSocket Protocols (Real-Time Streaming)

**Technical Characteristics:**

- **Bi-directional**: Server can push data to client without client request
- **Persistent connection**: TCP connection stays open (low latency for subsequent messages)
- **Event-driven**: Client subscribes to channels (e.g., `subscribe: AAPL, BTC-USD`), server pushes updates
- **Protocol upgrade**: Starts as HTTP, upgrades to WebSocket (`ws://` or `wss://` for secure)
- **Heartbeat/ping-pong**: Keep-alive messages prevent connection timeout

**Use Cases for Financial Data:**

- **Real-time quotes**: Stock prices, bid/ask spreads, volume
- **Level 2 order book**: Market depth (all bids/asks at each price level)
- **Trade execution notifications**: Instant notification when order fills
- **Live portfolio updates**: Position changes as trades execute

**Market Data Providers with WebSocket:**

- **Polygon.io**: WebSocket for real-time stocks, options, forex, crypto
- **IEX Cloud**: WebSocket for real-time US stock quotes
- **Binance WebSocket**: Real-time crypto prices (free, 10 connections per IP, 300 subscriptions per connection)
- **Coinbase Pro WebSocket**: Real-time crypto order book, trades, ticker
- **Finnhub WebSocket**: Real-time stock quotes ($99/month+)

**Vietnamese Market:**

- **SSI iBoard**: Mobile app likely uses WebSocket for real-time quotes (not documented for third-party use)
- **VPS/VCBS**: No public WebSocket APIs

**Pros:**

- **Low latency**: Sub-100ms updates (vs 500ms+ for REST polling)
- **Efficient**: Single connection for continuous updates (no repeated HTTP handshakes)
- **Real-time UX**: Live price tickers, instant P&L updates
- **Scalable**: Server pushes to many clients without per-client polling overhead

**Cons:**

- **Connection management complexity**:
  - Reconnection logic (handle network drops, server restarts)
  - Exponential backoff on reconnect failures
  - State synchronization after reconnect (re-subscribe to channels)
- **Stateful**: Connection must persist (vs REST's stateless simplicity)
- **Firewall/proxy issues**: Some corporate networks block WebSocket
- **Backpressure handling**: Client must keep up with message rate or buffer overflows

**Verdict for Fin-Sight:**

- **Use for real-time features (Phase 2+)**:
  - Binance WebSocket for live crypto prices
  - Polygon.io WebSocket for live US stock quotes (if budget allows)
- **Not viable for MVP**: EOD batch updates sufficient; WebSocket adds complexity
- **Not available for Vietnamese brokerages**: No public WebSocket APIs

---

### Vietnamese Brokerage Integration Realities

**SSI Securities (Market Leader):**

- **iBoard Platform**: Web, Pro (desktop), Mobile apps with 1M+ users
- **No Public API**: No developer documentation found; likely uses proprietary API for internal apps
- **Data Source**: vnstock library scrapes SSI data for stock fundamentals/prices
- **Integration Strategy for Fin-Sight**:
  - **MVP**: CSV export from iBoard → manual import to Fin-Sight
  - **Future**: Negotiate partnership for API access (after user traction proves demand)

**VPS Securities:**

- **SmartOne Platform**: Mobile-first trading app
- **No Public API**: No developer portal or documentation
- **Integration Strategy**: CSV export from VPS platform

**VCBS (Vietcombank Securities):**

- **Integration with Vietcombank**: Bank customers can link accounts
- **No Public API**: Conservative institution, no public developer access
- **Integration Strategy**: CSV export

**Alternative Approaches:**

1. **Screen scraping** (Selenium/Puppeteer): Brittle, violates ToS, high maintenance
2. **Plaid-style aggregation**: No Vietnamese equivalent yet (market opportunity!)
3. **Partnership negotiations**: Approach SSI/VPS with user traction data (10K+ users) to negotiate API access
4. **Community-driven data**: Users manually import via CSV (acceptable for MVP)

---

### Comparative Analysis: FIX vs REST vs WebSocket

| **Criterion**                | **FIX Protocol**                          | **REST API**                            | **WebSocket**                        |
| ---------------------------- | ----------------------------------------- | --------------------------------------- | ------------------------------------ |
| **Latency**                  | Low (binary SBE) to Medium (tagvalue)     | Medium (request-response overhead)      | **Very Low** (persistent connection) |
| **Complexity**               | **High** (FIX engine, session management) | Low (standard HTTP libraries)           | Medium (reconnection, state sync)    |
| **Use Case**                 | Order execution, institutional trading    | **Portfolio tracking**, historical data | **Real-time quotes**, live updates   |
| **Real-time Support**        | Yes (but overkill for portfolio tracking) | No (polling only)                       | **Yes** (server push)                |
| **Vietnamese Broker Access** | **No** (institutional only)               | **No** (no public APIs)                 | **No** (no public WebSocket APIs)    |
| **US Broker Access**         | Rare (Interactive Brokers, Bloomberg)     | **Common** (Plaid, Alpaca, Schwab)      | Common (Alpaca, Polygon, IEX)        |
| **Cost**                     | High (enterprise fees)                    | **Free to moderate** (API tiers)        | Moderate (data provider fees)        |
| **Maintenance Burden**       | High (session recovery, heartbeats)       | **Low** (stateless)                     | Medium (connection handling)         |
| **Fin-Sight MVP Fit**        | ❌ Overkill, not needed                   | ✅ **Best for MVP**                     | 🟡 Phase 2+ for real-time features   |

**Recommendation for Fin-Sight MVP:**

1. **REST APIs** for market data (Polygon.io, Binance, vnstock)
2. **CSV import** for Vietnamese brokerage holdings (SSI, VPS, VCBS)
3. **Plaid API** for US brokerage aggregation (Schwab, Fidelity, E\*TRADE)
4. **WebSocket** in Phase 2 for real-time features (live quotes, instant P&L updates)

---

## 2. Multi-Asset Data Normalization Strategies

### Symbol Identification Standards

**ISIN (International Securities Identification Number):**

- **Structure**: 12-character alphanumeric code (e.g., US0378331005 for Apple Inc.)
  - First 2 characters: Country code (ISO 3166-1 alpha-2) - US, VN, GB, etc.
  - Next 9 characters: National security identifier (e.g., CUSIP in US)
  - Last character: Check digit (modulo 10 validation)
- **Scope**: Global standard for equities, bonds, derivatives, commodities
- **Pros**: Unique identifier (one security = one ISIN), avoids ticker symbol ambiguity (same ticker on multiple exchanges)
- **Cons**: Not used for cryptocurrencies, requires lookup service/database
- **Example**: Apple stock has ONE ISIN (US0378331005) but multiple tickers (AAPL on NASDAQ, APC on LSE, etc.)

**CUSIP (Committee on Uniform Securities Identification Procedures):**

- **Structure**: 9-character alphanumeric code (US/Canada only)
- **Scope**: US and Canadian securities
- **Usage**: Embedded in ISIN (ISIN = Country Code + CUSIP + Check Digit)

**Ticker Symbols:**

- **Structure**: 1-5 characters (varies by exchange)
- **Issues**:
  - **Not globally unique**: AAPL (NASDAQ) vs APC (LSE) are the same security
  - **Exchange-specific**: Same company, different tickers on different exchanges
  - **Reuse**: Tickers can be reassigned (e.g., TWTR → X after Twitter rebrand)
- **Usage**: Human-readable, widely recognized, but **unreliable as primary key** in database

**Vietnamese Stock Symbols:**

- **Structure**: 3-character codes (HPG, VCB, VNM, FPT, MWG, VIC)
- **Scope**: HSX (Ho Chi Minh Stock Exchange), HNX (Hanoi Stock Exchange), UPCOM
- **Normalization**: vnstock library provides mapping (symbol → company name, industry, exchange)

**Cryptocurrency Symbols:**

- **Structure**: 3-4 characters (BTC, ETH, USDT, XRP)
- **Ambiguity**: Bitcoin = BTC (Coinbase, Binance) vs XBT (some exchanges follow ISO 4217-style naming)
- **No ISIN**: Cryptocurrencies not assigned ISIN codes
- **Contract variations**: BTCUSD, BTCUSDT, BTC-USD (different exchanges use different notation)
- **Chain-specific tokens**: ETH (Ethereum mainnet) vs WETH (Wrapped ETH), BSC tokens, Polygon tokens (require chain + contract address for uniqueness)

**Commodities:**

- **Futures contracts**: CL=F (Crude Oil futures), GC=F (Gold futures), SI=F (Silver futures)
- **Contract specs**: Include expiry date, delivery location, contract size (e.g., WTI Crude Oil, December 2025 contract)
- **Precious metals**: XAU (Gold), XAG (Silver), XPT (Platinum), XPD (Palladium) in ISO 4217 standard (troy ounce)

---

### Symbol Mapping Strategy for Fin-Sight

**Database Schema:**

```sql
CREATE TABLE securities (
  id UUID PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,  -- User-facing symbol (AAPL, BTC, VCB)
  isin VARCHAR(12),              -- ISIN if available (null for crypto)
  asset_type VARCHAR(20) NOT NULL,  -- 'stock', 'crypto', 'commodity', 'etf'
  exchange VARCHAR(50),          -- 'NASDAQ', 'HSX', 'Binance', 'CME'
  country_code CHAR(2),          -- ISO 3166-1 alpha-2 (US, VN, GB)
  currency_code CHAR(3),         -- ISO 4217 (USD, VND, EUR)
  company_name VARCHAR(255),     -- Apple Inc., Vietnam Commercial Joint Stock Bank
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(symbol, exchange, asset_type)  -- Composite unique constraint
);

-- Example rows:
-- ('uuid-1', 'AAPL', 'US0378331005', 'stock', 'NASDAQ', 'US', 'USD', 'Apple Inc.')
-- ('uuid-2', 'VCB', 'VN000000VCB6', 'stock', 'HSX', 'VN', 'VND', 'Vietnam Commercial Joint Stock Bank')
-- ('uuid-3', 'BTC', NULL, 'crypto', 'Binance', NULL, 'USD', 'Bitcoin')
-- ('uuid-4', 'XAU', NULL, 'commodity', 'COMEX', NULL, 'USD', 'Gold (Troy Ounce)')
```

**Import Logic:**

1. User enters ticker: "AAPL"
2. System prompts: "Which exchange?" (NASDAQ, LSE, XETRA)
3. Lookup ISIN: US0378331005
4. Store: `{symbol: 'AAPL', isin: 'US0378331005', exchange: 'NASDAQ', asset_type: 'stock'}`
5. For crypto: `{symbol: 'BTC', isin: null, exchange: 'Binance', asset_type: 'crypto'}`

**Fallback Strategy (when ISIN unavailable):**

- Use composite key: `(symbol, exchange, asset_type)` as unique identifier
- For Vietnamese stocks: Leverage vnstock library for validation
- For crypto: Use CoinGecko/CoinMarketCap API for symbol standardization

---

### Timestamp Normalization

**Challenge**: Different assets trade on different schedules and timezones

**US Stocks:**

- Trading hours: 9:30 AM - 4:00 PM EST (Eastern Time, UTC-5 or UTC-4 during DST)
- Pre-market: 4:00 AM - 9:30 AM EST
- After-hours: 4:00 PM - 8:00 PM EST

**Vietnamese Stocks:**

- Trading hours: 9:00 AM - 3:00 PM ICT (Indochina Time, UTC+7)
- Lunch break: 11:30 AM - 1:00 PM (some sessions)
- Market holidays: Vietnamese holidays (Tet, National Day)

**Cryptocurrency:**

- **24/7 trading**: No market close, trades around the clock
- Timezone: UTC (most exchanges report timestamps in UTC)

**Commodities:**

- **CME (Chicago Mercantile Exchange)**: 5:00 PM - 4:00 PM CST (Central Time, UTC-6)
- **COMEX (Gold/Silver)**: Electronic trading nearly 24/5

**Normalization Strategy:**

```python
# Store all timestamps in UTC in database
CREATE TABLE prices (
  security_id UUID REFERENCES securities(id),
  timestamp TIMESTAMPTZ NOT NULL,  -- PostgreSQL TIMESTAMPTZ stores UTC
  price NUMERIC(18, 8),
  volume BIGINT,
  source VARCHAR(50),  -- 'Polygon', 'Binance', 'vnstock'
  PRIMARY KEY (security_id, timestamp)
);

# Display logic: Convert to user's timezone or asset's exchange timezone
def format_price_time(timestamp_utc, user_timezone='America/New_York'):
    return timestamp_utc.astimezone(pytz.timezone(user_timezone))

# Market hours check:
def is_market_open(security, timestamp_utc):
    if security.asset_type == 'crypto':
        return True  # Always open
    elif security.exchange == 'NASDAQ':
        et = timestamp_utc.astimezone(pytz.timezone('America/New_York'))
        return et.hour >= 9 and et.hour < 16 and et.weekday() < 5
    elif security.exchange == 'HSX':
        ict = timestamp_utc.astimezone(pytz.timezone('Asia/Ho_Chi_Minh'))
        return ict.hour >= 9 and ict.hour < 15 and ict.weekday() < 5
```

---

### Price Normalization

**Price Types:**

- **Last**: Last traded price
- **Bid/Ask**: Best buy/sell offers in order book
- **Open/High/Low/Close (OHLC)**: Daily bar data
- **Adjusted Close**: Adjusted for splits/dividends (US stocks)

**Split/Dividend Adjustments:**

- **US Stocks**: Most APIs provide adjusted close (accounting for splits/dividends)
- **Vietnamese Stocks**: vnstock provides adjusted prices; manual tracking of corporate actions
- **Crypto**: No dividends or splits (except token splits like Ethereum's theoretical 1:1000 split)

**Currency Conversion:**

- Store prices in **native currency** (USD for US stocks, VND for Vietnamese stocks, BTC/USD or BTC/USDT for crypto)
- Portfolio-level aggregation: Convert all positions to user's base currency (USD, VND, or EUR)

**Example Schema:**

```python
# Store prices in native currency
{
  "security_id": "uuid-1",
  "symbol": "AAPL",
  "price": 175.43,
  "currency": "USD",
  "timestamp": "2025-12-26T14:30:00Z"
}

{
  "security_id": "uuid-2",
  "symbol": "VCB",
  "price": 82500,
  "currency": "VND",
  "timestamp": "2025-12-26T08:00:00Z"
}

# Portfolio aggregation (user base currency: USD)
def calculate_portfolio_value(user_holdings, base_currency='USD'):
    total_value = 0
    for holding in user_holdings:
        price_in_base = convert_currency(
            holding.price,
            holding.currency,
            base_currency,
            timestamp=holding.timestamp
        )
        total_value += price_in_base * holding.quantity
    return total_value
```

---

### Data Schema Harmonization (API Response Mapping)

**Problem**: Different APIs return data in different formats

**Examples:**

**Polygon.io (US stocks):**

```json
{
  "ticker": "AAPL",
  "queryCount": 1,
  "resultsCount": 1,
  "results": [
    {
      "T": "AAPL",
      "c": 175.43,
      "h": 176.12,
      "l": 174.88,
      "o": 175.0,
      "t": 1703606400000,
      "v": 12345678
    }
  ]
}
```

**Binance API (crypto):**

```json
{
  "symbol": "BTCUSDT",
  "lastPrice": "42350.12",
  "bidPrice": "42349.50",
  "askPrice": "42350.75",
  "volume": "12345.67890"
}
```

**vnstock (Vietnamese stocks):**

```python
# DataFrame with columns: ['time', 'open', 'high', 'low', 'close', 'volume']
df = stock.quote.history(symbol='VCB', start='2025-01-01', end='2025-12-26')
```

**Normalization Layer:**

```python
# Unified price model
@dataclass
class UnifiedPrice:
    symbol: str
    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int
    currency: str
    source: str  # 'Polygon', 'Binance', 'vnstock'

# Adapter pattern
class PolygonAdapter:
    def fetch_price(self, symbol: str, date: str) -> UnifiedPrice:
        raw = polygon_client.get_daily_bar(symbol, date)
        return UnifiedPrice(
            symbol=raw['T'],
            timestamp=datetime.fromtimestamp(raw['t'] / 1000, tz=timezone.utc),
            open=Decimal(str(raw['o'])),
            high=Decimal(str(raw['h'])),
            low=Decimal(str(raw['l'])),
            close=Decimal(str(raw['c'])),
            volume=raw['v'],
            currency='USD',
            source='Polygon'
        )

class BinanceAdapter:
    def fetch_price(self, symbol: str) -> UnifiedPrice:
        raw = binance_client.get_ticker(symbol=symbol)
        return UnifiedPrice(
            symbol=raw['symbol'],
            timestamp=datetime.now(tz=timezone.utc),
            open=None,  # Not provided by ticker endpoint
            high=None,
            low=None,
            close=Decimal(raw['lastPrice']),
            volume=int(float(raw['volume'])),
            currency='USDT',  # Assumes USDT pair
            source='Binance'
        )

class VnstockAdapter:
    def fetch_price(self, symbol: str, date: str) -> UnifiedPrice:
        df = stock.quote.history(symbol=symbol, start=date, end=date)
        row = df.iloc[0]
        return UnifiedPrice(
            symbol=symbol,
            timestamp=datetime.fromisoformat(row['time']).replace(tzinfo=timezone.utc),
            open=Decimal(str(row['open'])),
            high=Decimal(str(row['high'])),
            low=Decimal(str(row['low'])),
            close=Decimal(str(row['close'])),
            volume=int(row['volume']),
            currency='VND',
            source='vnstock'
        )
```

---

### Asset Class-Specific Normalization

**Equities (Stocks):**

- **Identifier**: ISIN (preferred) or Ticker + Exchange
- **Price**: Close price (adjusted for splits/dividends)
- **Currency**: Native currency (USD, VND, EUR)
- **Timestamp**: Market close time in exchange timezone → convert to UTC

**Cryptocurrencies:**

- **Identifier**: Symbol + Exchange (e.g., BTC-Binance, ETH-Coinbase)
- **Price**: Last traded price (no adjustments needed)
- **Currency**: Quote currency (USD, USDT, BTC for altcoins)
- **Timestamp**: UTC (24/7 trading)
- **Chain/Contract Address**: For token disambiguation (e.g., Ethereum mainnet vs BSC)

**Commodities:**

- **Identifier**: Futures contract code (CL=F) or ISO 4217 for precious metals (XAU, XAG)
- **Price**: Spot price or futures settlement price
- **Currency**: USD (most commodities priced in USD)
- **Unit**: Troy ounce (gold/silver), barrel (oil), bushel (wheat)

**ETFs:**

- **Identifier**: ISIN (ETFs have ISINs like stocks)
- **Price**: Net Asset Value (NAV) or market price
- **Currency**: Native currency
- **Timestamp**: Market close

---

### Normalization Best Practices for Fin-Sight

1. **Store in native format, convert at query time**:
   - Database: Store prices in VND, USD, USDT as received
   - Portfolio view: Convert all to user's base currency with real-time FX rates

2. **Use internal UUIDs as primary keys**:
   - Avoid using ticker symbols as primary keys (not unique)
   - Composite unique constraint: `(symbol, exchange, asset_type)`

3. **Timestamp everything in UTC**:
   - Convert to user timezone or exchange timezone only for display

4. **Adapter pattern for API integration**:
   - Unified `Price` model with source-specific adapters
   - Easy to add new data sources (Alpha Vantage, IEX, FTX)

5. **Validate symbols at import**:
   - US stocks: Lookup ISIN via Polygon.io or SEC EDGAR
   - Vietnamese stocks: Validate via vnstock library
   - Crypto: Validate via CoinGecko/CoinMarketCap API (check if symbol exists)

6. **Handle edge cases**:
   - **Delisted securities**: Mark as inactive, preserve historical data
   - **Renamed tickers**: Store ticker history (TWTR → X)
   - **Crypto token migrations**: Track old contract → new contract (e.g., token swaps)

---

## 3. Corporate Actions Handling

### Types of Corporate Actions

**Mandatory (Automatic):** Stock splits (adjust shares/price), cash dividends (payment + total return impact), stock dividends (increase shares), spinoffs (allocate cost basis), mergers/acquisitions (replace holdings).

**Voluntary (Require Decision):** Rights issues, tender offers.

**Data Sources:** SEC EDGAR, Polygon.io API (US); HSX announcements, CafeF news (VN); token swaps (crypto).

**MVP Strategy:** Manual entry form → Phase 2 semi-automated (webhooks) → Phase 3 fully automated feeds.

**Stock Split Impact:** 2-for-1 split: 100 shares @ $200 → 200 shares @ $100; cost basis per share halved; historical prices adjusted; total value unchanged.

---

## 4. Real-Time vs Delayed Data

**Cost Comparison:**

- MVP (500 users): $0-$300/mo (yfinance free + Binance free + Plaid $300)
- Growth (5K users): $2,100/mo (Polygon $99 + Plaid $2K)
- Scale (50K users): $15,400/mo (Polygon $399 + Plaid $15K)

**Revenue Model:** Freemium - delayed data free, real-time $10/mo premium. Target: 10% paid conversion at 50K users = $50K/mo revenue, $15.4K/mo costs = $34.6K profit.

**Strategy for Fin-Sight:**

- **MVP:** Delayed data (yfinance, vnstock, CoinGecko), real-time crypto via Binance (free)
- **Phase 2:** Premium tier ($10/mo) - real-time US stocks (Polygon WebSocket)
- **Phase 3:** Enterprise tier ($50/mo) - Level 2 data, API access

**Delayed is Acceptable:** Long-term investors, EOD portfolio updates, manual transaction entry. **Real-Time Needed:** Live tickers, intraday alerts, day trading, competitive differentiation.

---

## 5. Synthesis: SSI/VPS Integration & Architecture

### Vietnamese Brokerage Roadmap

**Phase 1 (MVP, Months 1-3):** CSV import from SSI/VPS/VCBS - manual upload, parse transactions, validate via vnstock.  
**Phase 2 (Months 4-6):** vnstock market data integration (free), CSV for holdings.  
**Phase 3 (Months 7-12):** Partnership negotiations - show 5K+ user traction, pitch API access.  
**Phase 4 (Year 2):** Native OAuth API integration - read-only holdings/transactions, WebSocket live quotes.

### Architecture Recommendations

**Data Pipeline:**

```
Market Data APIs (Polygon, Binance, vnstock, Plaid)
    ↓
Apache Airflow (nightly EOD batch + corporate action checks)
    ↓
Storage: ClickHouse (time-series prices) + PostgreSQL (user data) + Redis (real-time cache)
    ↓
NestJS API (GraphQL/REST)
    ↓
React Web App (Portfolio Dashboard)
```

**Key Decisions:**

- Batch EOD updates (MVP), hybrid with Redis cache (Phase 2)
- CSV import → OAuth partnership for Vietnamese brokers
- Internal UUID primary keys, ISIN for stocks, symbol+exchange for crypto
- Store timestamps in UTC, convert at query time
- Manual corporate actions (MVP) → automated (Phase 2+)

---

## 6. Key Takeaways

**Brokerage APIs:** FIX (overkill), REST (ideal for MVP), WebSocket (Phase 2+). No VN public APIs - use CSV import.

**Data Normalization:** UUID primary keys, ISIN for stocks, symbol+exchange+chain for crypto, timestamps in UTC, adapter pattern for APIs.

**Corporate Actions:** Manual entry MVP, semi-automated Phase 2 (webhooks), critical for accuracy (splits affect historical prices, dividends affect total return).

**Real-Time Strategy:** Delayed sufficient for MVP (free), crypto real-time free (Binance), freemium model ($10/mo real-time).

**VN Integration:** CSV → vnstock data → partnerships (5K+ users) → native API OAuth.

**Architectural MVP Priorities:**

- P0: yfinance (US stocks), vnstock (VN stocks), Binance (crypto) - all REST EOD
- P1: Plaid (US brokerages), Polygon.io (commodities)
- P2: CSV import (VN brokerages), options data

**Implementation Roadmap:**

- **Months 1-3:** Airflow pipeline, CSV import, FIFO cost basis, portfolio dashboard
- **Months 4-6:** Plaid integration, corporate actions form, multi-currency, Sharpe/Beta
- **Months 7-12:** WebSocket real-time, SSI/VPS partnerships, GraphQL API, mobile app
- **Year 2+:** Native VN OAuth, corporate action automation, options tracking, tax reporting

---

## Sources

**Standards:** FIX Protocol (Wikipedia, fixtrading.org), ISIN (Investopedia, ISO 6166), ISO 4217 currency codes.  
**APIs:** Polygon.io docs, Binance API, Alpha Vantage, yfinance library, vnstock library.  
**VN Market:** Vietnam market research doc (SSI/VPS/VCBS analysis, 5M+ accounts, no public APIs).  
**Corporate Actions:** Investopedia corporate actions explainer, SEC EDGAR.  
**Portfolio Context:** Portfolio Calculations domain research doc (TWR, MWR, FIFO, Sharpe, Beta).

**Limitations:** No official VN brokerage API docs found; relying on CSV + partnership strategy. Limited free corporate action automation for VN stocks.

---

**Research Completed: 2025-12-26**  
**Next: Priority 3 - Regulatory & Compliance** (SEC/FINRA, SSC/SBV, FinCEN, tax reporting)
