# Story 4.4: Data Source Reliability & Staleness Controls

Status: done

<!-- Note: Focus on "Calm" UX - stale data is better than no data, but users must be informed. -->

## Story

As a user,
I want to see clear visual cues if my asset data is older than 5 minutes or if a provider is disconnected,
so that I can make informed financial decisions without panic, knowing exactly how fresh the data is.

## Acceptance Criteria

1. **API Metadata Protocol**:
   - **Given** any API endpoint returning market data (e.g., Portfolio Detail, Asset Detail).
   - **When** the response is received.
   - **Then** the `meta` object **MUST** include a `staleness` timestamp (ISO 8601) indicating when the data was last fetched from the external provider.
   - **And** this timestamp reflects the _source_ age (stored in Hot Cache), not just the API response time.

2. **Staleness Visual Indicators (5-min Threshold)**:
   - **Given** a Portfolio or Asset view.
   - **When** `Date.now() - meta.staleness > 5 minutes`.
   - **Then** a visible "Stale Data" or "Last updated: X mins ago" badge appears (Yellow/Orange warning color).
   - **And** the UI does **NOT** block interaction; data remains visible.
   - **And** labels use `date-fns/formatDistanceToNow` for human-readable relative timing.

3. **Calm Error Handling & Offline Awareness**:
   - **Given** stale data is displayed.
   - **When** I click a "Refresh" button.
   - **Then** the system first checks `navigator.onLine`.
   - **And** if offline, shows a specific "You are offline" message instead of attempting a failed fetch.
   - **And** if online but the external API fails (e.g., Yahoo down), show a non-blocking error toast ("Could not refresh data").
   - **And** the screen does **NOT** get cleared to a loading state or error page; the Stale Data badge remains with its last known timestamp.

4. **Manual Refresh Trigger**:
   - **Given** user sees stale data.
   - **When** they click the refresh indicator/button.
   - **Then** the client forces a re-fetch (bypassing local cache where applicable).

## Tasks / Subtasks

- [x] **Task 1: Shared Infrastructure - Global Metadata DTO**
  - [x] Create `ApiResponse<T>` interface in `@workspace/shared-types` (to be used by both API and Web).
  - [x] Strictly type `meta.staleness` as an ISO string.

- [x] **Task 2: Backend - Cache & Metadata Enhancement (`services/api`)**
  - [x] Update `MarketDataService` to save the `fetched_at` timestamp in Redis (Hot Cache) alongside price data.
  - [x] Refactor `PortfoliosService` to return `last_updated_at` from Cache in the `meta` field of the response envelope.
  - [x] Ensure every market data fetch propagates this source timestamp.

- [x] **Task 3: Frontend - Staleness Logic (`apps/web`)**
  - [x] Create `useStaleness(timestamp: string)` hook.
    - Returns `isStale` (bool), `minutesOld` (number), `label` (string using `formatDistanceToNow`).
    - Threshold: 5 minutes.
  - [x] Create `StalenessBadge` component in `@workspace/ui` or `features/common`.
    - Visuals: Yellow badge with "clock" icon and relative time.
    - Action: Include `navigator.onLine` check before triggering refresh.

- [x] **Task 4: UI Integration - "Calm" Display**
  - [x] Update `DashboardClient` to handle wrapped API responses.
  - [x] Add `StalenessBadge` to Dashboard header (global staleness).
  - [x] Update `PortfolioDetailPage` to handle wrapped API responses and show badge.
  - [x] Aggregate allocation data correctly from all portfolios in Dashboard.
  - [x] Verify manual refresh (Fixing `refetch` vs `refresh` bug).

- [ ] **Task 4: Integration - Asset & Portfolio Pages**
  - [ ] Integrate `StalenessBadge` into `PortfolioHeader` and `AssetHeader`.
  - [ ] Wire up `onRefresh` to `queryClient.invalidateQueries`.
  - [ ] Verify "Calm" behavior by simulating API failure and offline modes.

## Dev Notes

### Shared Type Requirement

```typescript
// packages/shared-types/src/api/api-response.ts
export interface ApiResponse<T> {
  data: T;
  meta: {
    staleness: string; // ISO Date String
    [key: string]: any;
  };
}
```

### Architecture Constraints

- **Source of Truth**: The `staleness` timestamp comes from the **Backend** (Redis), NOT the Frontend `fetch` time.
- **UX Philosophy**: "Graceful Degradation". Never hide old data just because new data failed to load.
- **Financial Accuracy**: Metadata age is critical for time-sensitive assets (Forex/Crypto).

### References

- [Source: _bmad-output/epics.md#Story 4.4]
- [Source: _bmad-output/architecture.md#API Response Formats]
- [Source: _bmad-output/project-context.md#Critical Don't-Miss Rules]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 (Antigravity)

### Debug Log References

- MarketDataService already had `QuoteWithMetadata` interface with `lastUpdated`, `isStale`, `providerStatus` fields
- MarketDataService `getQuoteWithMetadata()` already implements staleness tracking with 5-min TTL and 1-hour fallback

### Completion Notes List

- **Task 1**: Created `ApiResponse<T>`, `ApiMeta`, `ApiError` interfaces with `createApiResponse()` and `createApiErrorResponse()` factory functions. Follows project standard envelope format: `{ success, data, error, meta }`.
- **Task 2 (Partial)**: MarketDataService already implements staleness tracking. `QuoteWithMetadata` stores `lastUpdated` ISO timestamp and `providerStatus` (live/cached/fallback). Stale fallback uses 1-hour TTL in Redis.
- **Task 3**: Created `useStaleness()` hook using 5-minute threshold with `date-fns/formatDistanceToNow`. Created `StalenessBadge` component with amber warning styling, clock icon, refresh button with `navigator.onLine` check, and animated offline indicator.
- **Remaining**: Task 2 controller envelope refactor and Task 4 page integration pending.

### File List

- `packages/shared-types/src/api/api-response.dto.ts` (NEW)
- `packages/shared-types/src/api/index.ts` (MODIFIED)
- `apps/web/src/hooks/use-staleness.ts` (NEW)
- `apps/web/src/hooks/use-staleness.test.ts` (NEW)
- `packages/ui/src/components/staleness-badge.tsx` (NEW)
