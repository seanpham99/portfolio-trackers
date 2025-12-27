# Story Prep-3: Seed Asset Data

Status: ready-for-dev

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

- [ ] **Task 1: Schema Verification**
    - [ ] Ensure an `assets` or `dim_asset` table exists (or create migration). 
    - [ ] *Note: Architecture calls for `Dim_Asset` in ClickHouse, but for MVP Transaction Entry we likely need a Postgres copy or foreign table. For now, let's create `public.assets` in Postgres.*
- [ ] **Task 2: Create Seed Script**
    - [ ] Create `supabase/seed.sql` or a TypeScript seed script.
    - [ ] Include top 30 VN stocks (VN30), top 30 US stocks, top 30 Crypto.
- [ ] **Task 3: Execute Seed**
    - [ ] Run seed and verify data in Supabase Dashboard.
