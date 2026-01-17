# Story 4.5: Tech Debt - Automated FX Rate Resolution

Status: done

<!-- Note: Focus on "Calm" UX - automated filling that can be manually overridden. Fail open (allow manual) if API fails. -->

## Story

As a user,
I want the system to automatically fetch the historical exchange rate when I enter a transaction for a foreign asset,
so that I don't have to look it up manually and my cross-currency accounting is accurate.

## Acceptance Criteria

1. **Auto-Fetch on Date/Asset Change**:
   - **Given** I am in the "Add Asset" or "Add Transaction" modal.
   - **When** I select a foreign asset (e.g., USD stock) in a portfolio with a different base currency (e.g., VND).
   - **And** I enter or change the `Transaction Date`.
   - **Then** the "Exchange Rate" field automatically updates with the historical close rate for that date.

2. **Backend Resolution Logic**:
   - **Given** a request for `USD` to `VND` rate on `2023-01-15`.
   - **When** the frontend calls the API.
   - **Then** the system fetches the rate from `yahoo-finance2` (or cache).
   - **And** returns the rate with sufficient precision (e.g., 4-6 decimal places).

3. **Caching Strategy (Immutable Data)**:
   - **Given** a historical date requests.
   - **When** the rate is fetched once.
   - **Then** it is cached in Redis with a long TTL (essentially immutable).

4. **Graceful Fallback**:
   - **Given** the external provider is down or data is missing.
   - **When** the auto-fetch fails.
   - **Then** the field remains editable, and the user can manually enter a rate (no blocking error).
   - **And** a subtle warning (toast or helper text) indicates "Could not fetch rate".

## Tasks / Subtasks

- [x] **Task 1: Backend - Market Data Service Expansion**
  - [x] Add `getHistoricalExchangeRate(from: string, to: string, date: Date)` to `MarketDataService`.
  - [x] Implement `yahoo-finance2` integration (Symbol: `USDVND=X` for currency pairs).
  - [x] Add Redis caching for historical rates (Key: `fx:rate:{from}:{to}:{date}`).
  - [x] **Tests**: Unit tests for service with mocked Yahoo provider.

- [x] **Task 2: Backend - API Endpoint**
  - [x] Create `GET /api/v1/market-data/exchange-rate` endpoint.
  - [x] DTO: `GetExchangeRateDto` (from, to, date).
  - [x] Validation: Ensure currencies are valid ISO codes (3 chars).

- [x] **Task 3: Frontend - Integration**
  - [x] Create/Update `useExchangeRate` hook (using TanStack Query).
    - [x] `enabled`: Only when `from !== to` and `date` is valid.
  - [x] Update `AddAssetModal`:
    - [x] Detect Portfolio Currency (Base) vs. Asset Currency.
    - [x] Trigger fetch when `transactionDate` or `selectedAsset` changes.
    - [x] Update `exchangeRate` form field with result.
    - [x] Show checking indicator (spinner in input? or standard loader).

## Dev Notes

### Technical Implementation

- **Yahoo Finance Symbols**:
  - Format is usually `RUB=X`, `EURUSD=X`. For USD to VND, it is `USDVND=X`.
  - Use `yahoo-finance2`'s `historical` method.
- **Date Handling**:
  - Yahoo Finance expects specific date formats. Ensure timezone alignment (UTC vs Local).
  - Historical data might be "close" price of that day.

- **Precision**:
  - Store/Send rates as **numbers** or **numeric strings**.
  - Frontend input is `type="number"`.

### Architecture Constraints

- **Resiliency**: Do not throw 500 if Yahoo is down. Return 404 or specific error code that frontend handles gracefully.
- **Caching**: This is high-value for caching. Historical rates never change.

### References

- [Source: services/api/src/market-data/market-data.service.ts]
- [Source: apps/web/src/features/transactions/add-asset-modal.tsx]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- services/api/src/market-data/market-data.service.ts
- services/api/src/market-data/market-data.controller.ts
- services/api/src/market-data/dto/get-exchange-rate.dto.ts
- services/api/src/market-data/market-data.module.ts
- services/api/src/market-data/market-data.service.spec.ts
- apps/web/src/api/client.ts
- apps/web/src/features/portfolio/hooks/use-exchange-rate.ts
- apps/web/src/features/transactions/add-asset-modal.tsx
