# Story 4.3: Mock Data Eviction & Service Hardening

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer, I want to replace all hardcoded price placeholders and empty metrics with real-time derivations, while hardening the data lineage to ensure financial precision, service resiliency, and UI-aware staleness metadata.

## Acceptance Criteria

1. **Precision Metric Derivation**:
   - **Given** active holdings in a portfolio.
   - **When** fetching portfolio summaries (`findAll`, `findOne`).
   - **Then** `change24h` and `change24hPercent` are recalculated using real historical quotes.
   - **And** `allocation` is returned as a breakdown matching the Asset Class categorization (All/VN/Global/Crypto).

2. **Service Resiliency & Graceful Degradation**:
   - **Given** a market data provider (Yahoo Finance/CoinGecko) is unreachable.
   - **When** requesting current or historical prices.
   - **Then** the service uses exponential backoff and falls back to the last cached value in **Upstash Redis**.
   - **And** the record is marked with `isStale: true` and `lastUpdated` timestamp in the API envelope.

3. **Data Boundary Compliance**:
   - **Given** a request for dashboard metrics vs. deep analytics.
   - **When** processing.
   - **Then** the service reads from **Redis** (hot cache) for summaries and **ClickHouse** only for deep historical time-series or multi-year technical indicators.

4. **API Contract Enforcement**:
   - **Given** the `PortfolioSummaryDto`.
   - **When** returning data to the frontend.
   - **Then** it must include metadata for **NFR3 (Staleness Indicators)**: `isStale`, `lastUpdated`, and `providerStatus`.

## Tasks / Subtasks

- [ ] **Task 1: Market Data Provider Hardening**
  - [ ] Implement `getQuoteWithMetadata(symbol)` to return prices along with `regularMarketChange` and `regularMarketChangePercent`.
  - [ ] Add `isStale` logic to `MarketDataService`: if external fetch fails, return Redis snapshot with `isStale: true`.
  - [ ] Implement historical price lookup (24h ago) with mandatory caching (TTL 24h).

- [ ] **Task 2: Service Calculation Logic**
  - [ ] Refactor `calculateHoldings` to return `allocation` objects mapped to symbols and market values.
  - [ ] Update `findAll`/`findOne` to aggregate 24h changes from daily quotes or the "previous close" field in the current quote.
  - [ ] Ensure all math uses `decimal.js` to prevent floating point drift during aggregation.

- [ ] **Task 3: DTO & Boundary Updates**
  - [ ] Update `@workspace/shared-types` (Portfolio/Holding DTOs) to include staleness and timestamp fields.
  - [ ] Ensure `PortfoliosService` respects the Redis-first strategy for active dashboard metrics.

- [ ] **Task 4: Cleanup & Verification**
  - [ ] Evict all `// Placeholder` comments and `0` hardcodes.
  - [ ] Update unit tests to simulate "Provider Down" scenarios and verify stale fallback.

## Dev Notes

### Architectural Guardrails

- **Hot vs. Cold Path**: Do not query ClickHouse for the main dashboard list. Use Redis for price snapshots + historical 24h close data.
- **Financial Math**: Portfolio total change = `Sum(Holdings * AssetPriceChange)`. Do not use float.

### Technical Requirements

- **NFR3 (Staleness)**: API responses must satisfy the `isStale` badge logic in the UI. Metadata must include the source (e.g., 'Yahoo', 'CoinGecko').
- **NFR8 (Resiliency)**: Exponential backoff is mandatory for all `MarketDataService` fetches.

### References

- [Source: services/api/src/portfolios/portfolios.service.ts]
- [Source: services/api/src/market-data/market-data.service.ts]
- [Source: _bmad-output/architecture.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

Antigravity (Google Deepmind)

### Completion Notes List

- Enhanced with validation fixes per BMad Quality Protocol.
- Added explicit staleness metadata and resiliency tasks.

### File List

- services/api/src/portfolios/portfolios.service.ts
- services/api/src/market-data/market-data.service.ts
- packages/shared-types/src/api/portfolio.dto.ts
