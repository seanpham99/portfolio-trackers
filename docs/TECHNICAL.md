# Finsight Technical Documentation v2.0

## Overview and Purpose

**Finsight** is a full-stack portfolio intelligence platform built on the Fin-Sight data engineering pipeline. The system extends the existing ELT architecture (Airflow + ClickHouse) with a three-tier web application: React 19 frontend, FastAPI middle layer, and hybrid PostgreSQL/ClickHouse backend.

**Problem Statement:** Vietnamese investors lack a unified platform that combines local market data with global assets (US stocks, crypto, commodities) in an elegant, decision-ready interface.

**Solution:** Finsight transforms institutional-grade data pipelines into consumer-facing portfolio tracking with:

- Spatial UI design reducing cognitive load
- Real-time technical indicators (RSI, MACD, MA) surfaced contextually
- AI-powered portfolio insights via existing Gemini integration
- Collaborative portfolios for investment clubs/families

**System Status:**

- **Data Pipeline:** Production-ready (Airflow 3.1.3 + ClickHouse)
- **Web Application:** Development phase (React 19 RC + FastAPI)
- **Deployment:** Docker Compose (dev), Kubernetes planned (production)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Data Model](#data-model)
4. [API Specification](#api-specification)
5. [Frontend Architecture](#frontend-architecture)
6. [Installation & Setup](#installation--setup)
7. [Development Workflow](#development-workflow)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Roadmap](#roadmap)

---

## 1. Architecture Overview

### 1.1 System Architecture Pattern

**Three-Tier Architecture with Event-Driven Data Layer**

```mermaid
graph TB
    subgraph client["Client Layer (Browser)"]
        webapp["React 19 Web App<br/>Vite + TypeScript"]
    end

    subgraph api["Application Layer (API Gateway)"]
        fastapi["FastAPI Service<br/>Python 3.12"]
        redis_cache["Redis Cache<br/>Hot Data (30s-5min TTL)"]

        fastapi -.->|Query Cache| redis_cache
    end

    subgraph data["Data Layer"]
        postgres["PostgreSQL<br/>(User Data)"]
        clickhouse["ClickHouse<br/>(Market Data)"]

        subgraph airflow_layer["Airflow Pipeline"]
            scheduler["Scheduler"]
            dag_global["market_data_global_batch<br/>(NEW)"]
            dag_vn["market_data_evening_batch<br/>(EXISTING)"]
            dag_news["market_news_morning<br/>(EXISTING)"]
        end
    end

    subgraph external["External Data Sources"]
        vnstock["vnstock<br/>(VN Stocks)"]
        yfinance["yfinance<br/>(US Stocks)"]
        coingecko["CoinGecko<br/>(Crypto)"]
        metals["MetalPriceAPI<br/>(Gold/Silver)"]
        gemini["Google Gemini<br/>(AI Summaries)"]
    end

    webapp -->|HTTPS| fastapi

    fastapi -->|User Queries| postgres
    fastapi -->|Market Queries| clickhouse
    fastapi -->|AI Requests| gemini

    scheduler -->|Triggers| dag_global
    scheduler -->|Triggers| dag_vn
    scheduler -->|Triggers| dag_news

    dag_global -->|Extract| yfinance
    dag_global -->|Extract| coingecko
    dag_global -->|Extract| metals
    dag_vn -->|Extract| vnstock
    dag_news -->|Extract| vnstock

    dag_global -->|Load| clickhouse
    dag_vn -->|Load| clickhouse
    dag_news -->|Load| clickhouse
    dag_news -->|Summarize| gemini

    classDef clientStyle fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef apiStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef dataStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef externalStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class webapp clientStyle
    class fastapi,redis_cache apiStyle
    class postgres,clickhouse,scheduler,dag_global,dag_vn,dag_news dataStyle
    class vnstock,yfinance,coingecko,metals,gemini externalStyle
```

---

### 1.2 Data Flow Patterns

#### Pattern 1: User Transaction Entry (Write Path)

```
User fills form → Frontend validation (React Hook Form + Zod)
    ↓
POST /api/v1/portfolios/{id}/transactions
    ↓
FastAPI validates request (Pydantic)
    ↓
Check authorization (JWT → user owns portfolio?)
    ↓
Validate ticker exists (Query ClickHouse dim_stock_companies)
    ↓
Insert to PostgreSQL transactions table
    ↓
Invalidate Redis cache: portfolio_summary:{portfolio_id}
    ↓
Return 201 Created with transaction object
    ↓
Frontend optimistically updates UI (useOptimistic hook)
    ↓
Background: Recalculate portfolio snapshot → ClickHouse fact_user_holdings
```

**Performance Targets:**

- Frontend validation: <10ms (client-side)
- API response time (P95): <200ms
- Cache invalidation: <5ms

---

#### Pattern 2: Dashboard Load (Read Path - Hot Data)

```
User navigates to dashboard → GET /api/v1/portfolios/{id}/summary
    ↓
FastAPI checks Redis: portfolio_summary:{portfolio_id}
    ├─ [CACHE HIT] Return cached JSON (10ms)
    └─ [CACHE MISS] Execute query orchestration:
        ↓
    1. Query PostgreSQL: Get user's transactions
        SELECT ticker, SUM(quantity * CASE WHEN type='BUY' THEN 1 ELSE -1 END)
        FROM transactions WHERE portfolio_id = ?
        GROUP BY ticker
        (20ms - indexed query)
        ↓
    2. Query ClickHouse: Get latest prices + indicators
        SELECT ticker, latest_price, latest_rsi, latest_macd
        FROM market_dwh.mv_latest_prices
        WHERE ticker IN (...)
        (30ms - materialized view)
        ↓
    3. Query Redis: Get exchange rates
        GET exchange_rate:USD:VND
        (5ms)
        ↓
    4. Calculate in Python:
        - Holdings value = quantity × latest_price × exchange_rate
        - Total portfolio value
        - 24h/7d/30d returns
        (10ms - in-memory computation)
        ↓
    5. Store result in Redis (TTL: 60s)
        SET portfolio_summary:{portfolio_id} {json} EX 60
        (5ms)
        ↓
    Return JSON to frontend (Total: ~70ms first load, 10ms subsequent)
```

**Why This Pattern?**

- **First Load:** Acceptable 70ms latency (sub-100ms target)
- **Cached Loads:** 10ms provides instant UI feedback
- **Stale Data Tolerance:** 60s cache is acceptable (prices update every 5 minutes in Airflow)

---

#### Pattern 3: Historical Chart Data (Read Path - Cold Data)

```
User opens Focus Mode (asset detail) → GET /api/v1/market/ohlc/{ticker}?period=1y
    ↓
FastAPI checks Redis: ohlc:{ticker}:1y
    ├─ [CACHE HIT] Return (10ms)
    └─ [CACHE MISS] Query ClickHouse:
        SELECT trading_date, open, high, low, close, volume,
               ma_50, ma_200, rsi_14, macd
        FROM market_dwh.fact_stock_daily
        WHERE ticker = ? AND trading_date >= today() - INTERVAL 1 YEAR
        ORDER BY trading_date
        (150ms - scans ~250 rows × 14 columns)
        ↓
    Store in Redis (TTL: 1 hour - historical data rarely changes)
        (10ms)
        ↓
    Return JSON (Total: ~160ms first load, 10ms subsequent)
```

**Why 1-Hour Cache?**

- Historical data is immutable (yesterday's prices never change)
- Only latest day updates (Airflow runs at 6 PM daily)
- Reduces ClickHouse load by 90%

---

### 1.3 Architectural Principles

#### 1.3.1 Separation of Concerns

| Layer                       | Responsibility                                      | NOT Responsible For                               |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| **Frontend (React)**        | UI rendering, user interactions, optimistic updates | Data validation, business logic, direct DB access |
| **API (FastAPI)**           | Authentication, business logic, query orchestration | UI rendering, long-running tasks                  |
| **Data Pipeline (Airflow)** | ETL, technical indicators, AI summaries             | User-facing queries, real-time requests           |
| **PostgreSQL**              | User data (ACID guarantees)                         | Analytical queries, time-series data              |
| **ClickHouse**              | Market data (OLAP queries)                          | Transactional updates, foreign keys               |
| **Redis**                   | Hot data caching                                    | Persistent storage                                |

---

#### 1.3.2 Query Optimization Strategy

**Problem:** Joining PostgreSQL (user transactions) + ClickHouse (market prices) is slow (200ms+)

**Solution: Pre-Aggregation via Airflow**

```python
# New Airflow DAG: user_holdings_snapshot (runs every 5 minutes)

@task
def calculate_user_holdings():
    """
    Query PostgreSQL for all user transactions, calculate net holdings,
    then insert snapshot to ClickHouse for fast querying
    """
    users_holdings = fetch_user_transactions_aggregated()  # PostgreSQL query

    for user_id, holdings in users_holdings.items():
        insert_to_clickhouse(
            'market_dwh.fact_user_holdings',
            {
                'user_id': user_id,
                'ticker': ticker,
                'quantity': net_quantity,
                'avg_cost_basis': weighted_avg_price,
                'snapshot_date': today()
            }
        )
```

**Result:**

- API queries only ClickHouse (single database, 20ms)
- Trade-off: Snapshot is 5 minutes stale (acceptable for most users)
- Critical for users: Refresh button forces immediate recalculation

---

#### 1.3.3 Security Model

**Authentication Flow (OAuth2 + JWT):**

```
1. User clicks "Sign in with Google"
2. Frontend redirects to Supabase Auth URL
3. Supabase handles OAuth flow
4. Supabase returns JWT (contains user_id, email, exp)
5. Frontend stores JWT in httpOnly cookie
6. Every API request includes cookie
7. FastAPI validates JWT signature (Supabase public key)
8. Extract user_id from JWT → use in queries
```

**Authorization Rules:**

```python
# FastAPI dependency injection
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = jwt.decode(token, SUPABASE_JWT_SECRET)
    user = await db.get_user(payload['sub'])
    if not user:
        raise HTTPException(401, "Invalid token")
    return user

# Endpoint with authorization
@router.get("/portfolios/{portfolio_id}/summary")
async def get_portfolio_summary(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_user)
):
    # Check ownership
    portfolio = await db.get_portfolio(portfolio_id)
    if portfolio.owner_id != current_user.id:
        # Check if user is invited member
        member = await db.get_portfolio_member(portfolio_id, current_user.id)
        if not member:
            raise HTTPException(403, "Access denied")

    # User authorized, proceed with query
    return await calculate_summary(portfolio_id)
```

**Security Checklist:**

- ✅ JWT tokens expire after 1 hour (refresh token lasts 30 days)
- ✅ HTTPS enforced (TLS 1.3)
- ✅ SQL injection prevented (parameterized queries via SQLAlchemy)
- ✅ CORS restricted to `finsight.app` domain
- ✅ Rate limiting: 100 requests/minute per user (FastAPI middleware)
- ✅ Secrets in environment variables (never in code)

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Category       | Technology      | Version | Justification                                                           |
| -------------- | --------------- | ------- | ----------------------------------------------------------------------- |
| **Framework**  | React           | 19.0.0  | Latest: useOptimistic for instant UI, Actions for simplified mutations  |
| **Build Tool** | Vite            | 6.0.1   | 10x faster dev server than Webpack, native ESM support                  |
| **Language**   | TypeScript      | 5.3.3   | Type safety reduces runtime errors by 40% (Microsoft study)             |
| **Styling**    | Tailwind CSS    | 4.0.0   | Utility-first, JIT compilation, 90% smaller CSS bundle                  |
| **Components** | Shadcn/ui       | Latest  | Radix UI primitives (accessible), fully customizable (no CSS overrides) |
| **Animation**  | Framer Motion   | 11.0.3  | 60fps animations, gesture library, 3KB gzipped                          |
| **Charts**     | Recharts        | 2.10.3  | React-native API, composable (vs D3.js imperative)                      |
| **State**      | TanStack Query  | 5.17.9  | Server state caching, automatic refetching, optimistic updates          |
| **Forms**      | React Hook Form | 7.49.2  | Uncontrolled inputs (better performance), Zod schema validation         |
| **Icons**      | Lucide React    | 0.303.0 | Tree-shakeable, consistent design, 1000+ icons                          |

**Dependencies Breakdown:**

```json
// package.json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^11.0.3",
    "recharts": "^2.10.3",
    "@tanstack/react-query": "^5.17.9",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "lucide-react": "^0.303.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "vite": "^6.0.1",
    "typescript": "^5.3.3",
    "tailwindcss": "^4.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

---

### 2.2 API Layer Stack

| Category       | Technology         | Version | Justification                                                                |
| -------------- | ------------------ | ------- | ---------------------------------------------------------------------------- |
| **Framework**  | FastAPI            | 0.109.0 | Async support (3x faster than Flask), auto OpenAPI docs, Pydantic validation |
| **Language**   | Python             | 3.12.1  | Latest stable, 20% faster than 3.10 (PEP 669 optimizations)                  |
| **ORM**        | SQLAlchemy         | 2.0.25  | AsyncIO support, connection pooling, query builder                           |
| **Validation** | Pydantic           | 2.5.3   | Type-safe models, auto JSON schema generation                                |
| **Auth**       | Supabase Auth SDK  | 2.0.2   | JWT validation, OAuth delegation                                             |
| **ClickHouse** | clickhouse-connect | 0.6.23  | Official driver, connection pooling, async support                           |
| **Redis**      | redis-py           | 5.0.1   | Async support, connection pooling                                            |
| **Testing**    | pytest             | 7.4.4   | Async test support, fixtures, 80% code coverage target                       |

**Critical Configuration:**

```python
# config.py - Production settings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    POSTGRES_URI: str = "postgresql+asyncpg://user:pass@postgres:5432/finsight"
    CLICKHOUSE_HOST: str = "clickhouse-server"
    CLICKHOUSE_PORT: int = 8123
    REDIS_URL: str = "redis://redis:6379/0"

    # Auth
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str

    # Performance
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    REDIS_MAX_CONNECTIONS: int = 50

    # Caching TTLs (seconds)
    CACHE_TTL_PORTFOLIO_SUMMARY: int = 60
    CACHE_TTL_LATEST_PRICES: int = 30
    CACHE_TTL_OHLC: int = 3600

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### 2.3 Data Pipeline Stack (Enhanced)

**Existing Infrastructure** (from Fin-Sight):

- Apache Airflow 3.1.3 (CeleryExecutor)
- ClickHouse (latest)
- PostgreSQL 16 (Airflow metadata)
- Redis 7.2 (Celery broker)

**New Components for Finsight:**

| Component            | Purpose                        | Integration Point                   |
| -------------------- | ------------------------------ | ----------------------------------- |
| **yfinance**         | US/Global stock data           | New DAG: `market_data_global_batch` |
| **CoinGecko API**    | Crypto prices (BTC, ETH, etc.) | New task group: `fetch_crypto`      |
| **MetalPriceAPI**    | Gold/Silver spot prices        | New task group: `fetch_commodities` |
| **exchangerate-api** | USD/VND/EUR rates              | New DAG: `exchange_rates_hourly`    |

**New DAG Structure:**

```python
# dags/market_data_global_batch.py
from airflow import DAG
from airflow.decorators import task, task_group
from datetime import datetime, timedelta

default_args = {
    'owner': 'finsight',
    'retries': 2,
    'retry_delay': timedelta(minutes=2)
}

with DAG(
    'market_data_global_batch',
    default_args=default_args,
    schedule='0 18 * * 1-5',  # 6 PM Mon-Fri (after US market close)
    start_date=datetime(2025, 1, 1),
    catchup=False
) as dag:

    @task_group
    def us_equities_pipeline():
        @task
        def extract_us_stocks():
            import yfinance as yf
            tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
            data = yf.download(tickers, period='2d', interval='1d')
            # Calculate technical indicators (reuse existing fetcher.py logic)
            return prepare_data_for_clickhouse(data, market_type='US')

        @task
        def load_us_stocks(data):
            from etl_modules.loader import load_to_clickhouse
            load_to_clickhouse('fact_stock_daily', data)

        extract_us_stocks() >> load_us_stocks()

    @task_group
    def crypto_pipeline():
        @task
        def extract_crypto():
            import requests
            url = 'https://api.coingecko.com/api/v3/coins/markets'
            params = {
                'vs_currency': 'usd',
                'ids': 'bitcoin,ethereum,binancecoin,cardano,solana',
                'order': 'market_cap_desc'
            }
            response = requests.get(url, params=params)
            # Transform to OHLCV format (use 24h high/low from API)
            return normalize_crypto_data(response.json())

        @task
        def load_crypto(data):
            load_to_clickhouse('fact_stock_daily', data)

        extract_crypto() >> load_crypto()

    @task_group
    def commodity_pipeline():
        @task
        def extract_commodities():
            import requests
            url = 'https://api.metalpriceapi.com/v1/latest'
            params = {'api_key': os.getenv('METAL_API_KEY'), 'base': 'USD', 'currencies': 'XAU,XAG'}
            response = requests.get(url, params=params)
            # XAU = Gold, XAG = Silver (prices per troy ounce)
            return format_commodity_data(response.json())

        @task
        def load_commodities(data):
            load_to_clickhouse('fact_stock_daily', data)

        extract_commodities() >> load_commodities()

    # Parallel execution
    [us_equities_pipeline(), crypto_pipeline(), commodity_pipeline()]
```

---

### 2.4 Infrastructure Stack

| Component                | Technology           | Purpose                                             |
| ------------------------ | -------------------- | --------------------------------------------------- |
| **Containerization**     | Docker 24.0+         | Consistent environments (dev = prod)                |
| **Orchestration (Dev)**  | Docker Compose       | Multi-service management (12 containers)            |
| **Orchestration (Prod)** | Kubernetes 1.28+     | Auto-scaling, self-healing, load balancing          |
| **Reverse Proxy**        | Nginx                | SSL termination, static file serving, rate limiting |
| **Monitoring**           | Prometheus + Grafana | Metrics collection, dashboards                      |
| **Logging**              | Loki + Promtail      | Centralized logs, query interface                   |
| **CI/CD**                | GitHub Actions       | Automated testing, Docker builds, deployments       |

---

## 3. Data Model

### 3.1 PostgreSQL Schema (Operational Database)

**Purpose:** Store user-generated data requiring ACID guarantees, foreign keys, and transactional integrity.

#### 3.1.1 Core Tables

```sql
-- Users table (synced with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- Matches Supabase auth.users.id
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  base_currency VARCHAR(3) DEFAULT 'USD' CHECK (base_currency IN ('USD', 'VND', 'EUR', 'SGD')),
  notification_preferences JSONB DEFAULT '{"email": true, "telegram": false}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (core financial data)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Asset identification
  ticker VARCHAR(20) NOT NULL,
  market_type VARCHAR(10) NOT NULL CHECK (market_type IN ('VN', 'US', 'CRYPTO', 'COMMODITY')),

  -- Transaction details
  transaction_type VARCHAR(4) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(20, 8) NOT NULL CHECK (price_per_unit > 0),
  transaction_currency VARCHAR(3) DEFAULT 'USD',
  transaction_date DATE NOT NULL CHECK (transaction_date <= CURRENT_DATE),

  -- Metadata
  notes TEXT,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'import_csv', 'api')),

  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Portfolio members (for shared portfolios)
CREATE TABLE portfolio_members (
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  PRIMARY KEY (portfolio_id, user_id)
);

-- Activity log (audit trail)
CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(20) NOT NULL,  -- 'transaction_add', 'transaction_edit', 'member_invite'
  action_details JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### 3.1.2 Indexes for Query Optimization

```sql
-- Portfolio queries
CREATE INDEX idx_portfolios_owner ON portfolios(owner_id);
CREATE INDEX idx_portfolio_members_user ON portfolio_members(user_id);

-- Transaction queries (most frequent)
CREATE INDEX idx_transactions_portfolio_date ON transactions(portfolio_id, transaction_date DESC);
CREATE INDEX idx_transactions_ticker ON transactions(ticker, market_type);
CREATE INDEX idx_transactions_user ON transactions(user_id, transaction_date DESC);

-- Activity log (recent activity)
CREATE INDEX idx_activity_log_portfolio_time ON activity_log(portfolio_id, timestamp DESC);

-- Full-text search on transactions notes
CREATE INDEX idx_transactions_notes_fts ON transactions USING gin(to_tsvector('english', notes));
```

**Index Rationale:**

- `idx_transactions_portfolio_date`: Dashboard query fetches all transactions for portfolio, sorted by date
- `idx_transactions_ticker`: Used in "Holdings by Ticker" aggregation
- Multi-column indexes follow "equality first, range second" rule

---

### 3.2 ClickHouse Schema (Analytical Database)

#### 3.2.1 Fact Tables (Extended for Finsight)

```sql
-- Existing table extended with new columns
ALTER TABLE market_dwh.fact_stock_daily
ADD COLUMN IF NOT EXISTS market_type Enum8('VN'=1, 'US'=2, 'CRYPTO'=3, 'COMMODITY'=4) DEFAULT 'VN',
ADD COLUMN IF NOT EXISTS base_currency String DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS exchange String DEFAULT 'HOSE';  -- HOSE, HNX, NASDAQ, NYSE, etc.

-- Add index for new query patterns
ALTER TABLE market_dwh.fact_stock_daily
ADD INDEX IF NOT EXISTS idx_market_type market_type TYPE set(0) GRANULARITY 4;

-- New table: Exchange rates
CREATE TABLE IF NOT EXISTS market_dwh.fact_exchange_rates (
  from_currency String,
  to_currency String,
  rate Float64,
  rate_date Date,
  source String DEFAULT 'exchangerate-api',
  ingested_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(ingested_at)
ORDER BY (from_currency, to_currency, rate_date)
PARTITION BY toYYYYMM(rate_date)
SETTINGS index_granularity = 8192;

-- New table: User holdings snapshot (for fast portfolio queries)
CREATE TABLE IF NOT EXISTS market_dwh.fact_user_holdings (
  user_id UUID,
  ticker String,
  market_type String,
  quantity Decimal64(8),
  avg_cost_basis Decimal64(2),
  snapshot_date Date,
  ingested_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (user_id, ticker, snapshot_date)
SETTINGS index_granularity = 8192;
```

#### 3.2.2 Materialized Views (Performance Optimization)

**Problem:** Querying latest prices requires `argMax()` aggregation on millions of rows (200ms+)

**Solution:** Materialized view pre-computes latest values

```sql
-- Materialized view: Latest prices (updated on INSERT)
CREATE MATERIALIZED VIEW IF NOT EXISTS market_dwh.mv_latest_prices
ENGINE = AggregatingMergeTree()
ORDER BY (ticker, market_type)
POPULATE
AS SELECT
  ticker,
  market_type,
  argMaxState(close, trading_date) as latest_price_state,
  argMaxState(trading_date, trading_date) as latest_date_state,
  argMaxState(rsi_14, trading_date) as latest_rsi_state,
  argMaxState(macd, trading_date) as latest_macd_state,
  argMaxState(ma_50, trading_date) as latest_ma50_state,
  argMaxState(ma_200, trading_date) as latest_ma200_state
FROM market_dwh.fact_stock_daily
GROUP BY ticker, market_type;

-- Query materialized view (returns pre-aggregated data in 10ms)
SELECT
  ticker,
  market_type,
  argMaxMerge(latest_price_state) as latest_price,
  argMaxMerge(latest_date_state) as last_updated,
  argMaxMerge(latest_rsi_state) as rsi_14,
  argMaxMerge(latest_macd_state) as macd
FROM market_dwh.mv_latest_prices
WHERE ticker IN ('HPG', 'VCB', 'AAPL', 'BTC-USD')
AND market_type IN ('VN', 'US', 'CRYPTO')
GROUP BY ticker, market_type;
```

**Performance Improvement:**

- Before: 200ms (full table scan with argMax)
- After: 10ms (materialized view query)
- Trade-off: 10MB additional storage for ~5000 tickers

---

#### 3.2.3 Analytical Views (Extended for Finsight)

```sql
-- Extended view: Market master with global assets
CREATE OR REPLACE VIEW market_dwh.view_market_global_master AS
SELECT
  d.ticker,
  d.trading_date,
  d.market_type,
  d.base_currency,
  d.exchange,
  d.close as price,
  d.volume,
  d.ma_50,
  d.ma_200,
  d.rsi_14,
  d.macd,
  d.macd_signal,
  d.daily_return,
  c.organ_name as company_name,
  c.sector,
  c.industry,
  -- Calculate returns
  (d.close - lag(d.close, 1) OVER w) / lag(d.close, 1) OVER w * 100 as return_1d,
  (d.close - lag(d.close, 7) OVER w) / lag(d.close, 7) OVER w * 100 as return_1w,
  (d.close - lag(d.close, 30) OVER w) / lag(d.close, 30) OVER w * 100 as return_1m
FROM market_dwh.fact_stock_daily d
LEFT JOIN market_dwh.dim_stock_companies c ON d.ticker = c.symbol
WINDOW w AS (PARTITION BY d.ticker ORDER BY d.trading_date);
```

---

## 4. API Specification

### 4.1 RESTful API Design

**Base URL:** `https://api.finsight.app/v1`

**Design Principles:**

- Follow REST conventions (GET/POST/PUT/DELETE)
- Use nouns for resources, verbs for actions
- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- JSON request/response bodies
- Cursor-based pagination for large datasets
- ISO 8601 timestamps (UTC)

---

### 4.2 Authentication Endpoints

#### POST /auth/callback

**Description:** OAuth callback handler (called by Supabase)

**Request Body:**

```json
{
  "code": "auth_code_from_oauth_provider",
  "provider": "google"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "refresh_token_here",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe"
  }
}
```

**Implementation:**

```python
from fastapi import APIRouter, HTTPException
from supabase import create_client

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/callback")
async def auth_callback(request: OAuthCallbackRequest):
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    # Exchange code for session
    session = supabase.auth.exchange_code_for_session(request.code)

    # Sync user to PostgreSQL
    await sync_user_to_db(session.user)

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in": 3600,
        "user": {
            "id": session.user.id,
            "email": session.user.email,
            "display_name": session.user.user_metadata.get("full_name")
        }
    }
```

---

### 4.3 User Endpoints

#### GET /users/me

**Description:** Get current user profile

**Headers:**

- `Authorization: Bearer {jwt_token}`

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "base_currency": "USD",
  "notification_preferences": {
    "email": true,
    "telegram": false
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2025-12-23T08:45:00Z"
}
```

**Caching:** Redis 5min TTL

---

#### PATCH /users/me

**Description:** Update user profile

**Request Body:**

```json
{
  "display_name": "John Smith",
  "base_currency": "VND",
  "notification_preferences": {
    "email": true,
    "telegram": true
  }
}
```

**Response (200):** Updated user object

**Side Effects:** Invalidates `user:{user_id}` cache

---

### 4.4 Portfolio Endpoints

#### GET /portfolios

**Description:** List user's portfolios (owned + shared)

**Query Parameters:**

- `include_shared` (boolean, default: true): Include portfolios user is member of

**Response (200):**

```json
{
  "portfolios": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Personal Investment",
      "description": "Long-term holdings",
      "is_shared": false,
      "role": "owner",
      "total_value": 45320.5,
      "total_value_currency": "USD",
      "daily_change_pct": 2.3,
      "member_count": 1,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Family Portfolio",
      "description": "Shared with spouse",
      "is_shared": true,
      "role": "editor",
      "total_value": 102450.75,
      "total_value_currency": "USD",
      "daily_change_pct": -0.8,
      "member_count": 2,
      "created_at": "2024-06-20T14:00:00Z"
    }
  ],
  "total_count": 2
}
```

---

#### POST /portfolios

**Description:** Create new portfolio

**Request Body:**

```json
{
  "name": "Retirement Fund",
  "description": "401k rollover + ETFs",
  "is_shared": false
}
```

**Response (201):**

```json
{
  "id": "new-portfolio-id",
  "name": "Retirement Fund",
  "owner_id": "user-id",
  "created_at": "2025-12-23T09:00:00Z"
}
```

---

#### GET /portfolios/{portfolio_id}/summary

**Description:** Get portfolio aggregated summary (MOST FREQUENTLY CALLED ENDPOINT)

**Response (200):**

```json
{
  "portfolio_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "total_value": 45320.5,
  "base_currency": "USD",
  "cost_basis": 40000.0,
  "total_return": 5320.5,
  "total_return_pct": 13.3,
  "performance": {
    "1d_change": 1050.2,
    "1d_change_pct": 2.3,
    "1w_change": 2100.5,
    "1w_change_pct": 4.8,
    "1m_change": 3200.0,
    "1m_change_pct": 7.6,
    "1y_change": 5320.5,
    "1y_change_pct": 13.3
  },
  "holdings_by_asset_class": {
    "equities": {
      "value": 30000.0,
      "pct": 66.2,
      "count": 8
    },
    "crypto": {
      "value": 12000.0,
      "pct": 26.5,
      "count": 3
    },
    "commodities": {
      "value": 3320.5,
      "pct": 7.3,
      "count": 1
    }
  },
  "top_holdings": [
    {
      "ticker": "AAPL",
      "market_type": "US",
      "quantity": 50,
      "avg_cost": 150.0,
      "current_price": 185.5,
      "value": 9275.0,
      "pct_of_portfolio": 20.5,
      "return_pct": 23.7,
      "rsi_14": 65.2,
      "signal": "neutral"
    },
    {
      "ticker": "VCB",
      "market_type": "VN",
      "quantity": 500,
      "avg_cost": 85.0,
      "current_price": 92.5,
      "value": 46250.0,
      "value_usd": 8250.0,
      "pct_of_portfolio": 18.2,
      "return_pct": 8.8,
      "rsi_14": 58.4,
      "signal": "neutral"
    }
  ],
  "last_updated": "2025-12-23T09:15:00Z"
}
```

**Performance Optimization:**

```python
@router.get("/portfolios/{portfolio_id}/summary")
async def get_portfolio_summary(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db)
):
    # Check authorization
    await verify_portfolio_access(db, portfolio_id, current_user.id)

    # Try cache first
    cache_key = f"portfolio_summary:{portfolio_id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Calculate fresh data
    summary = await calculate_portfolio_summary(
        db=db,
        portfolio_id=portfolio_id,
        user_currency=current_user.base_currency
    )

    # Cache for 60 seconds
    await redis.setex(
        cache_key,
        settings.CACHE_TTL_PORTFOLIO_SUMMARY,
        json.dumps(summary)
    )

    return summary
```

**Caching Strategy:**

- TTL: 60 seconds
- Invalidation: On transaction add/edit/delete
- Why 60s: Prices update every 5 minutes in Airflow, 60s provides good balance

---

#### GET /portfolios/{portfolio_id}/holdings

**Description:** Detailed holdings breakdown (paginated)

**Query Parameters:**

- `page` (int, default: 1)
- `per_page` (int, default: 20, max: 100)
- `sort_by` (enum: "value", "return_pct", "ticker", default: "value")
- `sort_order` (enum: "asc", "desc", default: "desc")
- `market_type` (optional filter: "VN", "US", "CRYPTO", "COMMODITY")

**Response (200):**

```json
{
  "holdings": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "market_type": "US",
      "exchange": "NASDAQ",
      "quantity": 50,
      "avg_cost_per_unit": 150.0,
      "current_price": 185.5,
      "total_value": 9275.0,
      "total_cost_basis": 7500.0,
      "unrealized_gain": 1775.0,
      "unrealized_gain_pct": 23.67,
      "pct_of_portfolio": 20.5,
      "technical_indicators": {
        "rsi_14": 65.2,
        "macd": 2.15,
        "ma_50": 175.3,
        "ma_200": 160.8,
        "signal": "neutral"
      },
      "last_transaction_date": "2024-11-15",
      "holding_period_days": 38
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 12,
    "total_pages": 1
  }
}
```

---

### 4.5 Transaction Endpoints

#### GET /portfolios/{portfolio_id}/transactions

**Description:** List transactions with filters

**Query Parameters:**

- `page`, `per_page` (pagination)
- `start_date`, `end_date` (ISO 8601 dates)
- `ticker` (optional filter)
- `transaction_type` (optional: "BUY", "SELL")

**Response (200):**

```json
{
  "transactions": [
    {
      "id": "txn-id-1",
      "ticker": "AAPL",
      "market_type": "US",
      "transaction_type": "BUY",
      "quantity": 25,
      "price_per_unit": 180.50,
      "total_amount": 4512.50,
      "transaction_currency": "USD",
      "transaction_date": "2024-12-15",
      "notes": "Buying the dip after earnings",
      "created_at": "2024-12-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### POST /portfolios/{portfolio_id}/transactions

**Description:** Add new transaction (optimistic locking)

**Request Body:**

```json
{
  "ticker": "BTC-USD",
  "market_type": "CRYPTO",
  "transaction_type": "BUY",
  "quantity": 0.5,
  "price_per_unit": 42000.0,
  "transaction_currency": "USD",
  "transaction_date": "2024-12-23",
  "notes": "Dollar-cost averaging"
}
```

**Validation Rules:**

- `ticker` must exist in ClickHouse `dim_stock_companies` or be valid crypto symbol
- `quantity` > 0
- `price_per_unit` > 0
- `transaction_date` <= today
- For SELL: `quantity` <= current holdings

**Response (201):**

```json
{
  "id": "new-txn-id",
  "ticker": "BTC-USD",
  "transaction_type": "BUY",
  "quantity": 0.5,
  "created_at": "2025-12-23T09:20:00Z"
}
```

**Side Effects:**

1. Insert to PostgreSQL `transactions` table
2. Invalidate Redis cache: `portfolio_summary:{portfolio_id}`
3. Trigger Airflow DAG: `user_holdings_snapshot` (async)
4. Insert to `activity_log` table

---

#### PUT /portfolios/{portfolio_id}/transactions/{transaction_id}

**Description:** Edit existing transaction

**Request Body:** Same as POST (partial updates allowed)

**Response (200):** Updated transaction object

---

#### DELETE /portfolios/{portfolio_id}/transactions/{transaction_id}

**Description:** Delete transaction

**Response (204):** No content

**Side Effects:** Same cache invalidation as POST

---

### 4.6 Market Data Endpoints

#### GET /market/latest

**Description:** Get latest prices for multiple tickers (batch query)

**Query Parameters:**

- `tickers` (comma-separated, max 50): "AAPL,VCB,BTC-USD,XAU"

**Response (200):**

```json
{
  "prices": [
    {
      "ticker": "AAPL",
      "market_type": "US",
      "price": 185.5,
      "change_1d": 2.3,
      "change_1d_pct": 1.25,
      "volume": 52000000,
      "rsi_14": 65.2,
      "macd": 2.15,
      "ma_50": 175.3,
      "ma_200": 160.8,
      "last_updated": "2025-12-23T21:00:00Z"
    }
  ],
  "exchange_rates": {
    "VND_to_USD": 0.00004,
    "EUR_to_USD": 1.08
  }
}
```

**Caching:** Redis 30s TTL (aligned with market data refresh)

**Implementation:**

```python
@router.get("/market/latest")
async def get_latest_prices(
    tickers: str = Query(..., max_length=500),
    redis: Redis = Depends(get_redis),
    clickhouse: Client = Depends(get_clickhouse)
):
    ticker_list = [t.strip().upper() for t in tickers.split(',')[:50]]

    # Build cache keys
    cache_keys = [f"price:{ticker}" for ticker in ticker_list]

    # Try batch get from Redis
    cached_prices = await redis.mget(cache_keys)

    # Find missing tickers
    missing_tickers = [
        ticker for ticker, cached in zip(ticker_list, cached_prices)
        if cached is None
    ]

    if missing_tickers:
        # Query ClickHouse materialized view
        query = """
        SELECT
            ticker,
            market_type,
            argMaxMerge(latest_price_state) as price,
            argMaxMerge(latest_rsi_state) as rsi_14,
            argMaxMerge(latest_macd_state) as macd,
            argMaxMerge(latest_ma50_state) as ma_50,
            argMaxMerge(latest_ma200_state) as ma_200,
            argMaxMerge(latest_date_state) as last_updated
        FROM market_dwh.mv_latest_prices
        WHERE ticker IN {tickers:Array(String)}
        GROUP BY ticker, market_type
        """
        result = clickhouse.query(query, parameters={'tickers': missing_tickers})

        # Cache results
        pipeline = redis.pipeline()
        for row in result.result_rows:
            ticker_data = dict(zip(result.column_names, row))
            pipeline.setex(
                f"price:{ticker_data['ticker']}",
                settings.CACHE_TTL_LATEST_PRICES,
                json.dumps(ticker_data)
            )
        await pipeline.execute()

    # Combine cached + fresh data
    return build_price_response(ticker_list, cached_prices, missing_tickers)
```

---

#### GET /market/ohlc/{ticker}

**Description:** Historical OHLCV data for charting

**Query Parameters:**

- `period` (enum: "1d", "1w", "1m", "3m", "1y", "5y", default: "1y")
- `interval` (enum: "1d", "1h", default: "1d")

**Response (200):**

```json
{
  "ticker": "AAPL",
  "market_type": "US",
  "interval": "1d",
  "data": [
    {
      "date": "2024-12-20",
      "open": 182.5,
      "high": 185.2,
      "low": 181.8,
      "close": 184.5,
      "volume": 48000000,
      "ma_50": 175.1,
      "ma_200": 160.5,
      "rsi_14": 64.5,
      "macd": 2.05
    }
  ],
  "total_points": 252
}
```

**Caching:** Redis 1hr TTL (historical data doesn't change)

---

#### GET /market/search

**Description:** Search tickers/companies (autocomplete)

**Query Parameters:**

- `q` (string, min 2 chars): Search query
- `market_type` (optional filter)
- `limit` (int, default: 10, max: 50)

**Response (200):**

```json
{
  "results": [
    {
      "ticker": "AAPL",
      "company_name": "Apple Inc.",
      "market_type": "US",
      "exchange": "NASDAQ",
      "sector": "Technology",
      "match_score": 1.0
    },
    {
      "ticker": "AAL",
      "company_name": "American Airlines Group Inc.",
      "market_type": "US",
      "exchange": "NASDAQ",
      "sector": "Transportation",
      "match_score": 0.85
    }
  ]
}
```

**Implementation:**

```sql
-- ClickHouse query with fuzzy matching
SELECT
    symbol as ticker,
    organ_name as company_name,
    market_type,
    exchange,
    sector,
    ngramDistance(upper(symbol), upper({query})) as score1,
    ngramDistance(upper(organ_name), upper({query})) as score2,
    greatest(score1, score2) as match_score
FROM market_dwh.dim_stock_companies
WHERE match_score > 0.3
ORDER BY match_score DESC
LIMIT {limit}
```

---

### 4.7 Analytics Endpoints

#### GET /portfolios/{portfolio_id}/performance

**Description:** Time-series performance data (for charts)

**Query Parameters:**

- `period` (enum: "1w", "1m", "3m", "1y", "all")
- `granularity` (enum: "daily", "weekly", "monthly")

**Response (200):**

```json
{
  "portfolio_id": "portfolio-id",
  "period": "1y",
  "granularity": "daily",
  "data_points": [
    {
      "date": "2024-01-01",
      "total_value": 40000.0,
      "cost_basis": 40000.0,
      "return_pct": 0.0
    },
    {
      "date": "2024-01-02",
      "total_value": 40150.0,
      "cost_basis": 40000.0,
      "return_pct": 0.375
    }
  ],
  "summary": {
    "start_value": 40000.0,
    "end_value": 45320.5,
    "total_return": 5320.5,
    "total_return_pct": 13.3,
    "best_day": {
      "date": "2024-11-08",
      "return_pct": 4.5
    },
    "worst_day": {
      "date": "2024-08-15",
      "return_pct": -3.2
    }
  }
}
```

---

#### GET /portfolios/{portfolio_id}/allocation

**Description:** Asset allocation breakdown

**Response (200):**

```json
{
  "by_asset_class": {
    "equities": 66.2,
    "crypto": 26.5,
    "commodities": 7.3
  },
  "by_geography": {
    "vietnam": 35.5,
    "united_states": 45.2,
    "global": 19.3
  },
  "by_sector": {
    "technology": 28.5,
    "financials": 22.0,
    "consumer_discretionary": 15.5,
    "other": 34.0
  },
  "diversification_score": 72.5,
  "recommendations": [
    "Consider reducing crypto exposure from 26.5% to target 20%",
    "Technology sector concentration (28.5%) is above recommended 25%"
  ]
}
```

---

### 4.8 Error Response Format

**Standard Error Object:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Transaction date cannot be in the future",
    "details": {
      "field": "transaction_date",
      "value": "2026-01-01",
      "constraint": "must be <= 2025-12-23"
    },
    "request_id": "req-7c9e6679",
    "timestamp": "2025-12-23T09:30:00Z"
  }
}
```

**Common Error Codes:**

- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409) - e.g., duplicate transaction
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

---

## 5. Frontend Architecture

### 5.1 Project Structure

```
frontend/
├── src/
│   ├── app/                      # App-level layout
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing page
│   │   └── (authenticated)/      # Protected routes group
│   │       ├── layout.tsx        # Auth layout with header
│   │       ├── dashboard/
│   │       │   └── page.tsx      # Main dashboard (Stage Slider)
│   │       ├── portfolio/
│   │       │   ├── [id]/
│   │       │   │   ├── page.tsx          # Portfolio detail
│   │       │   │   ├── transactions/     # Transaction history
│   │       │   │   └── settings/         # Portfolio settings
│   │       └── settings/
│   │           └── page.tsx      # User settings
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── portfolio/            # Domain components
│   │   │   ├── StageSlider.tsx          # Main spatial UI
│   │   │   ├── AssetCard.tsx            # Individual holding card
│   │   │   ├── FocusModal.tsx           # Detailed asset view
│   │   │   ├── AllocationRadar.tsx      # Radar chart
│   │   │   └── PerformanceChart.tsx     # Time-series chart
│   │   ├── transactions/
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── TickerAutocomplete.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Sparkline.tsx
│   │       └── CurrencyToggle.tsx
│   │
│   ├── lib/                      # Utilities & core logic
│   │   ├── api/                  # API client layer
│   │   │   ├── client.ts         # Axios/Fetch wrapper
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── portfolios.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   └── market.ts
│   │   │   └── hooks/            # React Query hooks
│   │   │       ├── usePortfolio.ts
│   │   │       ├── useTransactions.ts
│   │   │       └── useMarketData.ts
│   │   ├── utils/
│   │   │   ├── currency.ts       # Exchange rate helpers
│   │   │   ├── calculations.ts   # Portfolio math
│   │   │   ├── formatters.ts     # Number/date formatting
│   │   │   └── validators.ts     # Zod schemas
│   │   └── constants.ts          # App-wide constants
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Supabase auth wrapper
│   │   ├── useOptimisticUpdate.ts
│   │   └── useWebSocket.ts       # Real-time price updates
│   │
│   ├── styles/
│   │   ├── globals.css           # Tailwind imports + custom CSS
│   │   └── themes/
│   │       └── deep-space.css    # Dark theme variables
│   │
│   └── types/                    # TypeScript definitions
│       ├── portfolio.ts
│       ├── transaction.ts
│       ├── market.ts
│       └── api.ts
│
├── public/
│   ├── fonts/                    # Playfair Display, Geist Mono
│   └── images/
│
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   └── utils/
│   └── integration/
│       └── api/
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

### 5.2 Key Frontend Components

#### 5.2.1 StageSlider Component (Core UX)

**Purpose:** Horizontal swipeable stages for asset class separation

**Features:**

- Smooth 60fps animations (Framer Motion)
- Gesture support (swipe/drag on mobile, arrow keys on desktop)
- Dynamic background glows per stage
- Lazy-loaded data per stage (only fetch active stage data)

**Implementation:**

```tsx
// components/portfolio/StageSlider.tsx
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useState, useEffect } from "react";
import { usePortfolioSummary } from "@/lib/api/hooks/usePortfolio";

type Stage = "equities" | "crypto" | "commodities";

const STAGES: Stage[] = ["equities", "crypto", "commodities"];

const STAGE_CONFIG = {
  equities: {
    label: "Global Equities",
    glow: "from-blue-500/20 to-cyan-500/20",
    icon: "📊",
  },
  crypto: {
    label: "Crypto Assets",
    glow: "from-purple-500/20 to-pink-500/20",
    icon: "₿",
  },
  commodities: {
    label: "Precious Metals",
    glow: "from-amber-500/20 to-yellow-500/20",
    icon: "🪙",
  },
};

export function StageSlider({ portfolioId }: { portfolioId: string }) {
  const [activeStage, setActiveStage] = useState<Stage>("equities");
  const x = useMotionValue(0);

  // Fetch summary for active stage only
  const { data: summary, isLoading } = usePortfolioSummary(portfolioId, {
    stage: activeStage,
  });

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine direction
    if (Math.abs(velocity) >= 500 || Math.abs(offset) > 100) {
      const direction = offset > 0 ? -1 : 1;
      navigateStage(direction);
    }
  };

  const navigateStage = (direction: number) => {
    const currentIndex = STAGES.indexOf(activeStage);
    const nextIndex = Math.max(
      0,
      Math.min(STAGES.length - 1, currentIndex + direction)
    );
    setActiveStage(STAGES[nextIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateStage(-1);
      if (e.key === "ArrowRight") navigateStage(1);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeStage]);

  return (
    <div className="relative h-screen overflow-hidden bg-zinc-950">
      {/* Background glow effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-radial ${STAGE_CONFIG[activeStage].glow}`}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Stage navigation */}
      <div className="absolute top-8 left-0 right-0 flex justify-center gap-4 z-10">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-6 py-2 rounded-full transition-all ${
              activeStage === stage
                ? "bg-white/20 backdrop-blur-md text-white scale-110"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {STAGE_CONFIG[stage].icon} {STAGE_CONFIG[stage].label}
          </button>
        ))}
      </div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ x }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl px-8"
          >
            {isLoading ? (
              <StageSkeletonLoader />
            ) : (
              <StageContent stage={activeStage} summary={summary} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Navigation arrows */}
      <button
        onClick={() => navigateStage(-1)}
        disabled={STAGES.indexOf(activeStage) === 0}
        className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md disabled:opacity-30"
      >
        ←
      </button>
      <button
        onClick={() => navigateStage(1)}
        disabled={STAGES.indexOf(activeStage) === STAGES.length - 1}
        className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
}

// Stage content component
function StageContent({ stage, summary }: { stage: Stage; summary: any }) {
  return (
    <div className="text-center space-y-8">
      {/* Total value */}
      <div>
        <h2 className="text-6xl font-light text-white mb-2">
          ${summary?.holdings_by_asset_class[stage]?.value.toLocaleString()}
        </h2>
        <p
          className={`text-2xl ${
            summary?.performance["1d_change"] >= 0
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {summary?.performance["1d_change_pct"] >= 0 ? "▲" : "▼"}
          {Math.abs(summary?.performance["1d_change_pct"]).toFixed(2)}%
        </p>
      </div>

      {/* Sparkline */}
      <div className="h-32">
        <Sparkline data={summary?.sparkline_data} />
      </div>

      {/* Top holdings */}
      <div className="space-y-4">
        <h3 className="text-white/60 text-sm uppercase tracking-wide">
          Top Holdings
        </h3>
        {summary?.top_holdings?.slice(0, 3).map((holding) => (
          <AssetCard key={holding.ticker} holding={holding} />
        ))}
      </div>
    </div>
  );
}
```

**Performance Considerations:**

- Uses `AnimatePresence` for smooth transitions when changing stages
- Lazy loads data (only active stage fetches from API)
- Optimized re-renders with `React.memo` on child components
- GPU-accelerated animations (transforms only, no layout recalculations)

---

#### 5.2.2 FocusModal Component (Detailed View)

**Purpose:** Full-screen modal showing comprehensive asset analysis

**Features:**

- Glassmorphism backdrop (backdrop-blur-xl)
- Interactive candlestick chart (Recharts)
- Technical indicator overlays (MA50, MA200, RSI, MACD)
- Transaction markers on timeline
- News feed integration

**Implementation:**

```tsx
// components/portfolio/FocusModal.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useOHLCData } from "@/lib/api/hooks/useMarketData";
import {
  ComposedChart,
  Candlestick,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FocusModalProps {
  ticker: string;
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
}

export function FocusModal({
  ticker,
  isOpen,
  onClose,
  transactions,
}: FocusModalProps) {
  const { data: ohlc, isLoading } = useOHLCData(ticker, { period: "1y" });
  const { data: news } = useNewsForTicker(ticker);

  // Merge transactions with OHLC data for markers
  const chartData = useMemo(() => {
    if (!ohlc?.data) return [];

    return ohlc.data.map((point) => ({
      ...point,
      transaction: transactions?.find((t) => t.transaction_date === point.date),
    }));
  }, [ohlc, transactions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-zinc-950/95 backdrop-blur-xl border-white/10">
        <div className="grid grid-cols-3 gap-8 h-full">
          {/* Left: Chart (2/3 width) */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-light text-white">{ticker}</h2>
                <p className="text-white/60">{ohlc?.company_name}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl text-white">${ohlc?.latest_price}</p>
                <p
                  className={`text-xl ${
                    ohlc?.change_1d >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {ohlc?.change_1d >= 0 ? "+" : ""}
                  {ohlc?.change_1d_pct}%
                </p>
              </div>
            </div>

            {/* Main chart */}
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  {/* Candlestick bars */}
                  <Candlestick
                    dataKey={["open", "high", "low", "close"]}
                    stroke="none"
                    fill={(entry) =>
                      entry.close > entry.open ? "#10b981" : "#ef4444"
                    }
                  />

                  {/* Moving averages */}
                  <Line
                    type="monotone"
                    dataKey="ma_50"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="MA50"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma_200"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="MA200"
                  />

                  {/* Transaction markers */}
                  {chartData.map(
                    (point, index) =>
                      point.transaction && (
                        <circle
                          key={index}
                          cx={index}
                          cy={point.close}
                          r={6}
                          fill={
                            point.transaction.type === "BUY"
                              ? "#10b981"
                              : "#ef4444"
                          }
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      )
                  )}

                  <XAxis dataKey="date" stroke="#fff" opacity={0.3} />
                  <YAxis stroke="#fff" opacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Technical indicators */}
            <div className="grid grid-cols-3 gap-4">
              <TechnicalIndicatorCard
                label="RSI (14)"
                value={ohlc?.latest_rsi}
                threshold={{ overbought: 70, oversold: 30 }}
              />
              <TechnicalIndicatorCard
                label="MACD"
                value={ohlc?.latest_macd}
                signal={ohlc?.latest_macd_signal}
              />
              <TechnicalIndicatorCard
                label="Volume"
                value={ohlc?.avg_volume_30d}
                unit="M"
              />
            </div>
          </div>

          {/* Right: Sidebar (1/3 width) */}
          <div className="space-y-6 overflow-y-auto">
            {/* Fundamental metrics */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white/60 text-sm uppercase mb-4">
                Fundamentals
              </h3>
              <div className="space-y-2">
                <MetricRow label="P/E Ratio" value={ohlc?.pe_ratio} />
                <MetricRow label="ROE" value={`${ohlc?.roe}%`} />
                <MetricRow label="Debt/Equity" value={ohlc?.debt_to_equity} />
                <MetricRow
                  label="Market Cap"
                  value={`${(ohlc?.market_cap / 1e9).toFixed(2)}B`}
                />
              </div>
            </div>

            {/* Recent news */}
            <div className="space-y-4">
              <h3 className="text-white/60 text-sm uppercase">Recent News</h3>
              {news?.slice(0, 5).map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>

            {/* Your transactions */}
            {transactions && transactions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white/60 text-sm uppercase">
                  Your Transactions
                </h3>
                {transactions.map((txn) => (
                  <TransactionCard key={txn.id} transaction={txn} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**UX Optimizations:**

- Loads only when modal opens (lazy loading)
- Debounced chart interactions (300ms)
- Virtual scrolling for news feed (if >100 articles)
- WebGL-accelerated candlestick rendering (future: use D3 + Canvas)

---

### 5.3 State Management Strategy

**Philosophy:** Minimal client-side state, server as source of truth

**State Categories:**

| State Type       | Storage         | Example                       | Library                 |
| ---------------- | --------------- | ----------------------------- | ----------------------- |
| **Server State** | TanStack Query  | Portfolio data, market prices | `@tanstack/react-query` |
| **URL State**    | React Router    | Active stage, filters         | `next/navigation`       |
| **Form State**   | React Hook Form | Transaction form inputs       | `react-hook-form`       |
| **UI State**     | React useState  | Modal open/close, active tab  | Native hooks            |
| **Auth State**   | Supabase        | User session, JWT token       | `@supabase/supabase-js` |

**No Global State Library** (Redux/Zustand) because:

- TanStack Query handles 90% of data needs
- URL state replaces many "global" needs
- Simpler debugging (no action dispatchers)

---

### 5.4 React Query Configuration

```tsx
// lib/api/client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 30s
      staleTime: 30 * 1000,

      // Cache time: Keep in cache for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Retry logic
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },

      // Refetch on window focus (useful for dashboard)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Global error handler
      onError: (error) => {
        toast.error(error.message);
      },
    },
  },
});

// Custom hooks
export function usePortfolioSummary(
  portfolioId: string,
  options?: { stage?: string }
) {
  return useQuery({
    queryKey: ["portfolio", portfolioId, "summary", options?.stage],
    queryFn: () => api.portfolios.getSummary(portfolioId, options),
    staleTime: 60 * 1000, // 1 minute (matches backend cache)
    enabled: !!portfolioId,
  });
}

export function useAddTransaction(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: TransactionInput) =>
      api.transactions.create(portfolioId, transaction),

    // Optimistic update
    onMutate: async (newTransaction) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });

      // Snapshot previous value
      const previousSummary = queryClient.getQueryData([
        "portfolio",
        portfolioId,
        "summary",
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ["portfolio", portfolioId, "summary"],
        (old: any) => {
          return {
            ...old,
            // Recalculate total value
            total_value:
              old.total_value +
              newTransaction.quantity * newTransaction.price_per_unit,
          };
        }
      );

      return { previousSummary };
    },

    // Rollback on error
    onError: (err, newTransaction, context) => {
      queryClient.setQueryData(
        ["portfolio", portfolioId, "summary"],
        context.previousSummary
      );
    },

    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
    },
  });
}
```

---

## 6. Installation & Setup

### 6.1 Prerequisites

**System Requirements:**

- Node.js 20+ (for React 19 support)
- Docker 24.0+
- Docker Compose 2.0+
- Python 3.12+
- 8 GB RAM minimum (16 GB recommended)
- 20 GB free disk space

**Required Accounts:**

- Supabase account (free tier) - for authentication
- Google Cloud account - for Gemini API (free tier: 60 requests/minute)
- Telegram Bot (optional) - for notifications
- CoinGecko API key (free tier: 10-50 calls/minute)
- MetalPriceAPI key (free tier: 100 requests/month)

---

### 6.2 Backend Setup (Extended from Existing Fin-Sight)

#### Step 1: Clone and Navigate

```bash
git clone https://github.com/LGTM-but-NY/fin-sight.git
cd fin-sight
```

#### Step 2: Update Environment Variables

```bash
cd services/data-pipelines
cp .env.template .env
```

**Edit `.env` with new variables:**

```bash
# Existing variables
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
GEMINI_API_KEY=your_gemini_key
CLICKHOUSE_HOST=clickhouse-server
CLICKHOUSE_PORT=8123
AIRFLOW_UID=50000

# NEW: API keys for global data
COINGECKO_API_KEY=your_coingecko_key
METAL_PRICE_API_KEY=your_metal_api_key
EXCHANGE_RATE_API_KEY=your_exchangerate_key

# NEW: PostgreSQL for user data
POSTGRES_USER=finsight
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=finsight_app
POSTGRES_PORT=5433  # Different from Airflow's 5432

# NEW: FastAPI configuration
API_SECRET_KEY=generate_with_openssl_rand_hex_32
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_SERVICE_KEY=your_service_key

# NEW: Redis configuration
REDIS_PASSWORD=another_secure_password
```

#### Step 3: Update Docker Compose

**Add new services to `docker-compose.yml`:**

```yaml
version: "3.8"

services:
  # ... existing Airflow services ...

  # NEW: PostgreSQL for application data
  app-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5433:5432"
    volumes:
      - app-postgres-data:/var/lib/postgresql/data
      - ./scripts/init-app-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER}"]
      interval: 5s
      retries: 5

  # NEW: FastAPI application
  fastapi:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      - POSTGRES_URI=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@app-postgres:5432/${POSTGRES_DB}
      - CLICKHOUSE_HOST=${CLICKHOUSE_HOST}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      app-postgres:
        condition: service_healthy
      clickhouse-server:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./api:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # UPDATED: Redis with password
  redis:
    image: redis:7.2-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  app-postgres-data:
  # ... existing volumes ...
```

#### Step 4: Initialize Databases

```bash
# Start infrastructure services first
docker compose up -d app-postgres redis clickhouse-server

# Run schema migrations
docker compose exec app-postgres psql -U finsight -d finsight_app -f /docker-entrypoint-initdb.d/init.sql

# Extend ClickHouse schema
docker compose exec clickhouse-server clickhouse-client --query="$(cat scripts/clickhouse-migrations/002_add_global_markets.sql)"

# Start all services
docker compose up -d
```

**Migration Script:** `scripts/clickhouse-migrations/002_add_global_markets.sql`

```sql
-- Add new columns to existing table
ALTER TABLE market_dwh.fact_stock_daily
ADD COLUMN IF NOT EXISTS market_type Enum8('VN'=1, 'US'=2, 'CRYPTO'=3, 'COMMODITY'=4) DEFAULT 'VN',
ADD COLUMN IF NOT EXISTS base_currency String DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS exchange String DEFAULT 'HOSE';

-- Create exchange rates table
CREATE TABLE IF NOT EXISTS market_dwh.fact_exchange_rates (
  from_currency String,
  to_currency String,
  rate Float64,
  rate_date Date,
  source String DEFAULT 'exchangerate-api',
  ingested_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(ingested_at)
ORDER BY (from_currency, to_currency, rate_date);

-- Create user holdings snapshot table
CREATE TABLE IF NOT EXISTS market_dwh.fact_user_holdings (
  user_id UUID,
  ticker String,
  market_type String,
  quantity Decimal64(8),
  avg_cost_basis Decimal64(2),
  snapshot_date Date,
  ingested_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(snapshot_date)
ORDER BY (user_id, ticker, snapshot_date);

-- Create materialized view for latest prices
CREATE MATERIALIZED VIEW IF NOT EXISTS market_dwh.mv_latest_prices
ENGINE = AggregatingMergeTree()
ORDER BY (ticker, market_type)
POPULATE
AS SELECT
  ticker,
  market_type,
  argMaxState(close, trading_date) as latest_price_state,
  argMaxState(trading_date, trading_date) as latest_date_state,
  argMaxState(rsi_14, trading_date) as latest_rsi_state,
  argMaxState(macd, trading_date) as latest_macd_state
FROM market_dwh.fact_stock_daily
GROUP BY ticker, market_type;
```

#### Step 5: Deploy New Airflow DAGs

```bash
# Copy new DAG file
cp dags/market_data_global_batch.py services/data-pipelines/dags/

# Restart Airflow services to pick up new DAG
docker compose restart airflow-scheduler airflow-worker airflow-dag-processor

# Verify DAG appears in UI
open http://localhost:8080
# Login: admin / admin
# Navigate to DAGs → Enable "market_data_global_batch"
```

---

### 6.3 Frontend Setup

#### Step 1: Create Frontend Directory

```bash
cd fin-sight
mkdir frontend
cd frontend
```

#### Step 2: Initialize React Project

```bash
# Using Vite with React 19 template
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install react@rc react-dom@rc  # React 19 RC
npm install framer-motion recharts @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install @supabase/supabase-js
npm install lucide-react clsx tailwind-merge

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Initialize Tailwind
npx tailwindcss init -p
```

#### Step 3: Configure Tailwind

**Edit `tailwind.config.ts`:**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep Space theme
        background: "hsl(240 10% 3.9%)",
        foreground: "hsl(0 0% 98%)",
        primary: {
          DEFAULT: "hsl(142.1 76.2% 36.3%)",
          foreground: "hsl(355.7 100% 97.3%)",
        },
        // ... add more custom colors
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["Geist Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

#### Step 4: Setup Environment Variables

**Create `.env.local`:**

```bash
VITE_API_BASE_URL=http://localhost:8000/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_WS_URL=ws://localhost:8000/ws  # For real-time updates
```

#### Step 5: Create API Client

**Create `src/lib/api/client.ts`:**

```typescript
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (add JWT)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

#### Step 6: Run Development Server

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Airflow UI: http://localhost:8080
# ClickHouse: http://localhost:8123/play
```

---

## 7. Development Workflow

### 7.1 Daily Development Cycle

**Morning Routine:**

```bash
# 1. Pull latest changes
git pull origin main

# 2. Start all services
cd services/data-pipelines
docker compose up -d

# 3. Start frontend dev server
cd ../../frontend
npm run dev

# 4. Check service health
docker compose ps  # All should be "healthy"
curl http://localhost:8000/health  # API health check
```

**Development Loop:**

1. Make code changes (frontend or backend)
2. Hot reload (Vite HMR or FastAPI --reload)
3. Test manually in browser
4. Write automated tests
5. Commit with conventional commits

**Evening Routine:**

```bash
# Stop services (preserves data)
docker compose stop

# OR: Full cleanup (removes containers, keeps volumes)
docker compose down
```

---

### 7.2 Git Workflow

**Branch Strategy:** GitHub Flow (simplified)

```bash
# Create feature branch
git checkout -b feature/transaction-edit-ui

# Make changes, commit often
git add .
git commit -m "feat(transactions): add edit modal UI"

# Push and create PR
git push origin feature/transaction-edit-ui
# Open PR on GitHub, request review

# After approval, merge to main
# Delete feature branch
git branch -d feature/transaction-edit-ui
```

**Commit Message Convention:** (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructure (no behavior change)
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build process, dependencies

**Examples:**

```
feat(portfolio): add asset allocation radar chart

Implements pentagon radar chart showing allocation by:
- Asset class (stocks/crypto/commodities)
- Geography (VN/US/Global)
- Sector (tech/finance/energy)

Uses Recharts RadarChart component with custom styling.

Closes #45
```

---

### 7.3 Testing Workflow

#### 7.3.1 Backend Tests

```bash
cd services/data-pipelines

# Run all tests
./run_tests.sh

# Run specific test file
pytest tests/unit/test_fetcher.py -v

# Run with coverage
pytest --cov=dags --cov-report=html

# Open coverage report
open htmlcov/index.html
```

#### 7.3.2 Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

**Test File Convention:**

- Unit tests: `ComponentName.test.tsx` (co-located with component)
- Integration tests: `tests/integration/*.test.ts`
- E2E tests: `tests/e2e/*.spec.ts`

---

### 7.4 Code Quality Tools

#### 7.4.1 Frontend Linting

**Install ESLint + Prettier:**

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
```

# Create .eslintrc.json

```json
{
  "extends": [
    "@typescript-eslint/parser",
    "@typescript-eslint/eslint-plugin",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
}
```

**Pre-commit Hook:**

```bash
npm install -D husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

# Configure lint-staged in package.json

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

```
                  /\
                 /  \
               /  E2E  \      5% - User flows (Playwright)
              /----------\
             /            \
           / Integration   \   15% - API + DB (pytest + pytest-asyncio)
          /------------------\
         /                    \
       /    Unit Tests          \ 80% - Components, utils, hooks (Vitest)
      /--------------------------\
```

---

### 8.2 Backend Testing (FastAPI)

#### 8.2.1 Unit Tests

**Example: Test portfolio calculation logic**

```python
# tests/unit/test_portfolio_calculations.py
import pytest
from decimal import Decimal
from api.services.portfolio import calculate_portfolio_value, calculate_returns

def test_calculate_portfolio_value_simple():
    """Test basic portfolio value calculation"""
    holdings = [
        {'ticker': 'AAPL', 'quantity': 10, 'price': 185.50},
        {'ticker': 'VCB', 'quantity': 100, 'price': 92.50, 'exchange_rate': 0.00004}
    ]

    result = calculate_portfolio_value(holdings, base_currency='USD')

    assert result['total_value'] == Decimal('1855.00') + Decimal('370.00')
    assert len(result['holdings']) == 2

def test_calculate_returns_with_zero_cost_basis():
    """Edge case: Cost basis is zero (should return None)"""
    result = calculate_returns(current_value=1000, cost_basis=0)

    assert result['return_pct'] is None
    assert result['return_absolute'] == 1000

def test_calculate_returns_negative():
    """Test negative returns"""
    result = calculate_returns(current_value=800, cost_basis=1000)

    assert result['return_pct'] == -20.0
    assert result['return_absolute'] == -200
```

#### 8.2.2 Integration Tests

**Example: Test full API endpoint with test database**

```python
# tests/integration/test_portfolio_api.py
import pytest
from httpx import AsyncClient
from fastapi import status

@pytest.mark.asyncio
async def test_create_portfolio(client: AsyncClient, auth_headers):
    """Test POST /portfolios endpoint"""
    payload = {
        'name': 'Test Portfolio',
        'description': 'Integration test portfolio',
        'is_shared': False
    }

    response = await client.post(
        '/v1/portfolios',
        json=payload,
        headers=auth_headers
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data['name'] == 'Test Portfolio'
    assert 'id' in data

@pytest.mark.asyncio
async def test_get_portfolio_summary_unauthorized(client: AsyncClient):
    """Test accessing portfolio without auth returns 401"""
    response = await client.get('/v1/portfolios/fake-id/summary')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_add_transaction_validates_quantity(client: AsyncClient, auth_headers, test_portfolio):
    """Test transaction validation"""
    payload = {
        'ticker': 'AAPL',
        'market_type': 'US',
        'transaction_type': 'BUY',
        'quantity': -10,  # Invalid: negative quantity
        'price_per_unit': 185.50,
        'transaction_date': '2024-12-20'
    }

    response = await client.post(
        f'/v1/portfolios/{test_portfolio.id}/transactions',
        json=payload,
        headers=auth_headers
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'quantity' in response.json()['error']['details']
```

**Test Fixtures:**

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from api.main import app
from api.database import get_db

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5434/test_finsight"

@pytest.fixture
async def db_session():
    """Create test database session"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session

    # Drop tables after test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    """Create test client with test database"""
    app.dependency_overrides[get_db] = lambda: db_session

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_headers(client, db_session):
    """Create authenticated user and return headers"""
    user = await create_test_user(db_session)
    token = generate_test_jwt(user.id)
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
async def test_portfolio(db_session, auth_headers):
    """Create test portfolio"""
    portfolio = Portfolio(
        name='Test Portfolio',
        owner_id=extract_user_id(auth_headers)
    )
    db_session.add(portfolio)
    await db_session.commit()
    return portfolio
```

---

### 8.3 Frontend Testing

#### 8.3.1 Component Tests (Vitest + React Testing Library)

```typescript
// components/portfolio/AssetCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { AssetCard } from "./AssetCard";
import { describe, it, expect, vi } from "vitest";

describe("AssetCard", () => {
  const mockHolding = {
    ticker: "AAPL",
    company_name: "Apple Inc.",
    quantity: 10,
    current_price: 185.5,
    value: 1855.0,
    return_pct: 15.5,
    rsi_14: 65.2,
  };

  it("renders holding information correctly", () => {
    render(<AssetCard holding={mockHolding} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("$1,855.00")).toBeInTheDocument();
    expect(screen.getByText("+15.5%")).toBeInTheDocument();
  });

  it("applies correct color for positive returns", () => {
    render(<AssetCard holding={mockHolding} />);

    const returnElement = screen.getByText("+15.5%");
    expect(returnElement).toHaveClass("text-emerald-400");
  });

  it("applies correct color for negative returns", () => {
    const negativeHolding = { ...mockHolding, return_pct: -5.2 };
    render(<AssetCard holding={negativeHolding} />);

    const returnElement = screen.getByText("-5.2%");
    expect(returnElement).toHaveClass("text-red-400");
  });

  it("calls onFocus when card is clicked", () => {
    const mockOnFocus = vi.fn();
    render(<AssetCard holding={mockHolding} onFocus={mockOnFocus} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockOnFocus).toHaveBeenCalledWith("AAPL");
  });

  it("shows RSI indicator badge when overbought", () => {
    const overboughtHolding = { ...mockHolding, rsi_14: 75 };
    render(<AssetCard holding={overboughtHolding} />);

    expect(screen.getByText("Overbought")).toBeInTheDocument();
  });
});
```

#### 8.3.2 Hook Tests

```typescript
// lib/api/hooks/usePortfolio.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePortfolioSummary } from "./usePortfolio";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../client";

vi.mock("../client");

describe("usePortfolioSummary", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches portfolio summary successfully", async () => {
    const mockSummary = {
      total_value: 45320.5,
      total_return_pct: 13.3,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockSummary });

    const { result } = renderHook(
      () => usePortfolioSummary("test-portfolio-id"),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
  });

  it("handles error gracefully", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(
      () => usePortfolioSummary("test-portfolio-id"),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error.message).toBe("Network error");
  });

  it("uses cached data when available", async () => {
    const mockSummary = { total_value: 45320.5 };

    // Pre-populate cache
    queryClient.setQueryData(["portfolio", "test-id", "summary"], mockSummary);

    const { result } = renderHook(() => usePortfolioSummary("test-id"), {
      wrapper,
    });

    // Should return cached data immediately
    expect(result.current.data).toEqual(mockSummary);
    expect(result.current.isLoading).toBe(false);

    // Should not call API
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
```

#### 8.3.3 E2E Tests (Playwright)

```typescript
// tests/e2e/portfolio-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Portfolio Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");
  });

  test("should create portfolio and add transaction", async ({ page }) => {
    // Create portfolio
    await page.click('button:has-text("New Portfolio")');
    await page.fill('input[name="name"]', "E2E Test Portfolio");
    await page.fill('textarea[name="description"]', "Created by Playwright");
    await page.click('button:has-text("Create")');

    await expect(page.locator("text=E2E Test Portfolio")).toBeVisible();

    // Add transaction
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[name="ticker"]', "AAPL");
    await page.click('li:has-text("AAPL - Apple Inc.")'); // Autocomplete
    await page.fill('input[name="quantity"]', "10");
    await page.fill('input[name="price_per_unit"]', "185.50");
    await page.click('button[type="submit"]');

    // Verify transaction appears
    await expect(page.locator("text=AAPL")).toBeVisible();
    await expect(page.locator("text=$1,855.00")).toBeVisible();
  });

  test("should navigate between stages", async ({ page }) => {
    // Start on Equities stage
    await expect(
      page.locator('button.active:has-text("Global Equities")')
    ).toBeVisible();

    // Navigate to Crypto
    await page.click('button:has-text("Crypto Assets")');
    await expect(
      page.locator('button.active:has-text("Crypto Assets")')
    ).toBeVisible();

    // Use arrow key navigation
    await page.keyboard.press("ArrowRight");
    await expect(
      page.locator('button.active:has-text("Precious Metals")')
    ).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(
      page.locator('button.active:has-text("Crypto Assets")')
    ).toBeVisible();
  });

  test("should open focus modal and display chart", async ({ page }) => {
    // Click on asset card
    await page.click('[data-testid="asset-card-AAPL"]');

    // Modal should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Apple Inc.")).toBeVisible();

    // Chart should render
    await expect(page.locator("canvas, svg")).toBeVisible();

    // Technical indicators visible
    await expect(page.locator("text=RSI (14)")).toBeVisible();
    await expect(page.locator("text=MACD")).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

**Run E2E Tests:**

```bash
# Install Playwright
npm install -D @playwright/test

# Run tests in headless mode
npx playwright test

# Run with UI (visual debugging)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/portfolio-flow.spec.ts
```

---

### 8.4 Testing Checklist

**Before Committing:**

- [ ] All unit tests pass (`npm test` / `pytest`)
- [ ] No linting errors (`npm run lint` / `flake8`)
- [ ] Code coverage > 80% for new code
- [ ] Manual testing in browser (at least 2 browsers)

**Before Merging PR:**

- [ ] All CI checks pass (GitHub Actions)
- [ ] Integration tests pass
- [ ] E2E tests pass for critical flows
- [ ] Code review approved
- [ ] Documentation updated (if needed)

---

## 9. Deployment

### 9.1 Deployment Architecture

**Environment Strategy:**

- **Development:** Local Docker Compose (this document)
- **Staging:** Kubernetes cluster (DigitalOcean/AWS EKS)
- **Production:** Kubernetes cluster with high availability

**Infrastructure Overview:**

```
                         ┌──────────────┐
                         │  CloudFlare  │
                         │     CDN      │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │   Nginx      │
                         │ Load Balancer│
                         └──────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
         ┌──────▼───────┐ ┌────▼────┐ ┌────────▼───────┐
         │  Frontend    │ │ FastAPI │ │    Airflow     │
         │  (Nginx)     │ │  Pods   │ │     Pods       │
         │   x2 pods    │ │  x3     │ │   (Celery)     │
         └──────────────┘ └─────┬───┘ └────────┬───────┘
                                │              │
                    ┌───────────┴──────────┬───┴──────┐
                    │                      │          │
             ┌──────▼────────┐   ┌────────▼──┐ ┌─────▼────┐
             │  PostgreSQL   │   │ ClickHouse│ │  Redis   │
             │  (StatefulSet)│   │ (Cluster) │ │ (Cluster)│
             └───────────────┘   └───────────┘ └──────────┘
```

---

### 9.2 Production Deployment Steps

#### 9.2.1 Containerization

**Frontend Dockerfile:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**FastAPI Dockerfile:**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

#### 9.2.2 Kubernetes Manifests

**FastAPI Deployment:**

```yaml
# k8s/api/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finsight-api
  namespace: finsight
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finsight-api
  template:
    metadata:
      labels:
        app: finsight-api
    spec:
      containers:
        - name: api
          image: ghcr.io/your-org/finsight-api:latest
          ports:
            - containerPort: 8000
          env:
            - name: POSTGRES_URI
              valueFrom:
                secretKeyRef:
                  name: database-secrets
                  key: postgres-uri
            - name: CLICKHOUSE_HOST
              value: clickhouse-service
            - name: REDIS_URL
              value: redis://redis-service:6379/1
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
```

**API Service:**

```yaml
# k8s/api/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: finsight-api-service
  namespace: finsight
spec:
  selector:
    app: finsight-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: ClusterIP
```

**Ingress (with SSL):**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finsight-ingress
  namespace: finsight
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - finsight.app
        - api.finsight.app
      secretName: finsight-tls
  rules:
    - host: finsight.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
    - host: api.finsight.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: finsight-api-service
                port:
                  number: 80
```

---

#### 9.2.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          cd services/data-pipelines
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests
        run: |
          cd services/data-pipelines
          pytest --cov --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage

      - name: Run lint
        run: |
          cd frontend
          npm run lint

  build-and-push:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:latest

      - name: Build and push Frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure Kubernetes
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout restart deployment/finsight-api -n finsight
          kubectl rollout restart deployment/finsight-frontend -n finsight
```

---

### 9.3 Monitoring & Observability

#### 9.3.1 Prometheus Metrics

**FastAPI Metrics Endpoint:**

```python
# api/middleware/metrics.py
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import Request
import time

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response

@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

#### 9.3.2 Grafana Dashboard

**Key Metrics to Monitor:**

- API response times (P50, P95, P99)
- Request rate (requests/second)
- Error rate (5xx errors %)
- Database connection pool usage
- Redis cache hit rate
- Airflow DAG success/failure rate
- ClickHouse query latency

---

## 10. Roadmap

### 10.1 Completed (Existing Fin-Sight)

- ✅ Airflow data pipeline for Vietnamese stocks
- ✅ ClickHouse data warehouse with technical indicators
- ✅ Telegram notifications with Gemini AI summaries

### 10.2 Phase 1: MVP (3 Months) - Q1 2026

**Goal:** Launch web app with core portfolio tracking

- [ ] **Week 1-2:** Backend setup
  - [ ] FastAPI project structure
  - [ ] PostgreSQL schema + migrations
  - [ ] Authentication (Supabase integration)
  - [ ] Portfolio & transaction CRUD endpoints
- [ ] **Week 3-4:** Global data pipeline
  - [ ] `market_data_global_batch` DAG
  - [ ] US stocks (yfinance integration)
  - [ ] Crypto prices (CoinGecko)
  - [ ] Exchange rates table
- [ ] **Week 5-8:** Frontend foundation
  - [ ] React project setup + routing
  - [ ] Authentication flow (login/signup)
  - [ ] Stage Slider component
  - [ ] Transaction form + list
  - [ ] Basic asset cards
- [ ] **Week 9-10:** Integration
  - [ ] Connect frontend to API
  - [ ] TanStack Query setup
  - [ ] Optimistic updates
  - [ ] Error handling
- [ ] **Week 11-12:** Testing & Launch
  - [ ] E2E tests for critical flows
  - [ ] Performance optimization
  - [ ] Beta user testing (10 users)
  - [ ] Production deployment

**Success Metrics:**

- 50 active users
- <200ms API response time (P95)
- 95% uptime
- 0 critical bugs

---

### 10.3 Phase 2: Feature Expansion (3 Months) - Q2 2026

- [ ] **Focus Mode** (detailed asset view)
  - [ ] Interactive candlestick charts
  - [ ] Transaction markers on timeline
  - [ ] News feed integration
- [ ] **Team Portfolios**
  - [ ] Invitation system
  - [ ] Role-based access control
  - [ ] Activity log
- [ ] **Asset Allocation Visualizations**
  - [ ] Radar chart
  - [ ] Treemap
  - [ ] Diversification score
- [ ] **Multi-currency Support**
  - [ ] Currency selector
  - [ ] Real-time exchange rates
  - [ ] Per-asset currency display

**Success Metrics:**

- 200 active users
- 10% portfolios are shared
- 30% retention (30-day)

---

### 10.4 Phase 3: Intelligence Features (6 Months) - Q3-Q4 2026

- [ ] **AI Portfolio Insights**
  - [ ] Weekly email digests
  - [ ] Personalized recommendations
  - [ ] Risk alerts
- [ ] **Simulation Mode**
  - [ ] Backtesting engine
  - [ ] Timeline replay
  - [ ] Performance comparison
- [ ] **Real-time Updates**
  - [ ] WebSocket price streaming
  - [ ] Live portfolio value updates
  - [ ] Push notifications
- [ ] **Advanced Analytics**
  - [ ] Sharpe ratio calculator
  - [ ] Correlation matrix
  - [ ] Monte Carlo simulation
- [ ] **Mobile App**
  - [ ] React Native (iOS + Android)
  - [ ] Biometric authentication
  - [ ] Offline mode

**Success Metrics:**

- 500 active users
- 40% retention (30-day)
- $10M portfolio value tracked
- 4.5+ App Store rating

---

### 10.5 Long-Term Vision (2027+)

- **Premium Tier**
  - Advanced indicators (Bollinger Bands, Fibonacci)
  - Tax reporting
  - API access for power users
- **Social Features** (carefully curated)
  - Follow successful investors
  - Share portfolio snapshots
  - Investment clubs
- **Broker Integration**
  - Auto-sync trades from brokers
  - One-click rebalancing
- **International Expansion**
  - Support more markets (EU, Asia)
  - Multi-language support

---

## 11. Appendix

### 11.1 Glossary

**Technical Terms:**

- **OLAP:** Online Analytical Processing (read-heavy queries, aggregations)
- **OLTP:** Online Transaction Processing (write-heavy, ACID guarantees)
- **Materialized View:** Pre-computed query results stored as a table
- **ReplacingMergeTree:** ClickHouse table engine that deduplicates rows
- **JWT:** JSON Web Token (authentication mechanism)
- **Optimistic Update:** Update UI before server confirms (rollback on error)

**Financial Terms:**

- **OHLCV:** Open, High, Low, Close, Volume (candlestick data)
- **RSI:** Relative Strength Index (momentum indicator, 0-100)
- **MACD:** Moving Average Convergence Divergence (trend indicator)
- **MA:** Moving Average (smoothed price over N periods)
- **P/E Ratio:** Price-to-Earnings ratio (valuation metric)
- **Cost Basis:** Average purchase price of holdings

---

### 11.2 Useful Commands

**Docker:**

```bash
# View logs
docker compose logs -f service-name

# Restart specific service
docker compose restart service-name

# Access container shell
docker compose exec service-name bash

# View resource usage
docker stats
```

**Kubernetes:**

```bash
# Get pod status
kubectl get pods -n finsight

# View logs
kubectl logs -f pod-name -n finsight

# Port forward
kubectl port-forward svc/finsight-api-service 8000:80 -n finsight

# Scale deployment
kubectl scale deployment/finsight-api --replicas=5 -n finsight
```

**Database:**

```bash
# ClickHouse query
docker compose exec clickhouse-server clickhouse-client --query="SELECT count() FROM market_dwh.fact_stock_daily"

# PostgreSQL connect
docker compose exec app-postgres psql -U finsight -d finsight_app

# Redis CLI
docker compose exec redis redis-cli -a $REDIS_PASSWORD
```

---

### 11.3 Resources

**Official Documentation:**

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React 19 RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [ClickHouse Docs](https://clickhouse.com/docs/en/intro)
- [Airflow Docs](https://airflow.apache.org/docs/)

**Community:**

- [Finsight Discord](https://discord.gg/finsight) (coming soon)
- [GitHub Discussions](https://github.com/LGTM-but-NY/fin-sight/discussions)

**Related Projects:**

- [vnstock Library](https://github.com/thinh-vu/vnstock)
- [TradingView Charts](https://www.tradingview.com/)

---

**Document Version:** 2.0  
**Last Updated:** December 23, 2025  
**Maintainer:** LGTM-but-NY  
**License:** MIT---

### 11.3 Resources

**Official Documentation:**

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React 19 RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [ClickHouse Docs](https://clickhouse.com/docs/en/intro)
- [Airflow Docs](https://airflow.apache.org/docs/)

**Community:**

- [Finsight Discord](https://discord.gg/finsight) (coming soon)
- [GitHub Discussions](https://github.com/LGTM-but-NY/fin-sight/discussions)

**Related Projects:**

- [vnstock Library](https://github.com/thinh-vu/vnstock)
- [TradingView Charts](https://www.tradingview.com/)

---

**Document Version:** 2.0  
**Last Updated:** December 23, 2025  
**Maintainer:** LGTM-but-NY  
**License:** MIT
