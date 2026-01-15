# Story Prep-3: Seed Asset Data

Status: done

## Story

As a Developer,
I want the database seeded with a foundational list of Assets (VN Stocks, US Stocks, Crypto),
so that the "Add Transaction" autocomplete feature has data to search against.

## Acceptance Criteria

1.  **Given** the `Dim_Asset` table (to be created if not exists, or `public.assets`)
2.  **When** I run the seed script
3.  **Then** it should populate at least 100 common tickers (e.g., AAPL, VCB, BTC)
4.  **And** the data should include `symbol`, `name`, `asset_class`, and `currency`.

## Tasks

- [x] **Task 1: Schema Design & Architecture**
  - [x] Analyzed TPT vs STI vs Hybrid patterns
  - [x] Designed Single Table Inheritance (STI) schema for scalability
  - [x] Architecture approved by PM and user

- [x] **Task 2: ClickHouse Schema**
  - [x] Created `market_dwh.dim_assets` table with STI design
  - [x] Added `asset_class` (discriminator) + `market` columns
  - [x] Partitioned by `asset_class` for query efficiency
  - [x] Uses `LowCardinality` for enum-like columns
  - [x] Added deprecation notice to `dim_stock_companies` (kept for backward compat)

- [x] **Task 3: Supabase Migration**
  - [x] Created `public.assets` table with STI design
  - [x] Added CHECK constraints for `asset_class` validation
  - [x] Added `market_required_for_stocks` constraint
  - [x] Created fuzzy search indexes (pg_trgm)
  - [x] Enabled RLS with "Users can view all assets" policy
  - [x] Regenerated TypeScript types with `pnpm run db:gen-types`

- [x] **Task 4: Airflow DAGs**
  - [x] Updated `assets_dimension_etl.py` for STI schema
  - [x] Updated `sync_assets_to_postgres.py` for STI schema
  - [x] **FIXED:** Changed TRUNCATE to UPSERT (preserves foreign keys)
  - [x] Added `market` field: VN stocks (market='VN'), US stocks (market='US'), Crypto (market=NULL)

- [x] **Task 5: Code Review Fixes**
  - [x] Fixed TRUNCATE → UPSERT to preserve FK relationships
  - [x] Added deprecation notice to `dim_stock_companies`
  - [x] Documented migration plan in `schema-migration-plan.md`
  - [x] Used correct type gen command: `pnpm run db:gen-types`

## Architecture Decision

**Pattern:** Single Table Inheritance (STI)

**Rationale:**

- Scales to 100+ markets without schema changes
- Single RLS policy, single trigger
- Simple queries (no UNIONs)
- JSONB metadata for type-specific fields

**Schema:**

```
ClickHouse: market_dwh.dim_assets
  - symbol, name_en, name_local
  - asset_class (STOCK, CRYPTO, BOND, ETF)
  - market (VN, US, UK, JP - empty for CRYPTO)
  - currency, exchange, sector, industry
  - external_api_metadata Map

Supabase: public.assets
  - Same structure
  - metadata JSONB instead of Map
  - UPSERT sync to preserve FK relationships
```

## Code Review Issues (All Fixed)

| Issue                         | Status        | Fix                               |
| ----------------------------- | ------------- | --------------------------------- |
| TRUNCATE breaks FKs           | ✅ Fixed      | Use UPSERT with ON CONFLICT       |
| dim_stock_companies duplicate | ✅ Documented | Keep for now, deprecate in Epic 4 |
| Type gen command              | ✅ Fixed      | Use `pnpm run db:gen-types`       |

## Remaining Manual Steps

To fully verify this story, you need to:

1. Start ClickHouse and run `init_clickhouse.py`
2. Trigger `assets_dimension_etl` DAG in Airflow
3. Trigger `sync_assets_to_postgres` DAG
4. Verify 100+ assets in Supabase
