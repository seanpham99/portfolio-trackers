# Story 5.3: Connections Management Hub

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a centralized "Connections" page to manage all my external API integrations,
so that I can easily see what's connected, view sync status, and manage my exchange credentials in one place.

## Acceptance Criteria

1. **Given** the application settings navigation.
2. **When** I navigate to `/connections`.
3. **Then** I see status cards for each provider (Binance, OKX) with "Connected/Disconnected" indicators.
4. **Then** each connected provider shows the last sync timestamp.
5. **Then** I can add a new connection using the "Add Connection" button.
6. **Then** I can delete an existing connection (with confirmation).
7. **Then** I can manually trigger a sync for a connected exchange.
8. **Then** the page displays a helpful empty state when no connections exist.

## Tasks / Subtasks

- [x] **Task 1: Enhance Backend Sync Status Tracking (AC: 4)**
  - [x] Add `last_sync_at` (TIMESTAMP) to `user_connections` table via migration (Note: used existing `last_synced_at` column)
  - [x] Update `ConnectionDto` in `@workspace/shared-types` to include `lastSyncAt`
  - [x] Modify `ExchangeSyncService.sync()` to update `last_sync_at` after successful sync
  - [x] Update `ConnectionsService.toDto()` to map `last_sync_at`

- [x] **Task 2: Add Manual Sync Endpoint (AC: 7)**
  - [x] Create `POST /connections/:id/sync` endpoint in `ConnectionsController`
  - [x] Implement `ConnectionsService.syncOne(userId, connectionId)` method (Implemented as `ExchangeSyncService.syncHoldings` call from Controller)
  - [x] Add proper error handling for failed sync attempts
  - [x] Apply Rate Limiting (ThrottleGuard) to prevent API abuse
  - [x] Ensure response follows `ApiResponse<ConnectionDto>` envelope
  - [x] Add Swagger documentation for the endpoint

- [x] **Task 3: Enhance Connection Card Component (AC: 3, 4)**
  - [x] Update `ConnectionCard` to display last sync timestamp using `useStaleness` hook
  - [x] Add visual indicator for sync staleness (>5 minutes shows warning)
  - [x] Add "Sync Now" button to each card
  - [x] Add Delete button with confirmation dialog
  - [x] Display connection status (active/inactive)

- [x] **Task 4: Implement Sync Functionality on Frontend (AC: 7)**
  - [x] Add `syncConnection` mutation to `useConnections` hook
  - [x] Integrate mutation with "Sync Now" button on ConnectionCard
  - [x] Show loading state during sync operation
  - [x] Display success/error toast after sync attempt
  - [x] Invalidate queries to refresh connection list after sync
  - [x] Implement UI cooldown (disable button for 60s) after sync

- [x] **Task 5: Improve Empty State (AC: 8)**
  - [x] Enhance empty state component with better copy
  - [x] Add visual icon/illustration
  - [x] Include clear CTA to add first connection
  - [x] List supported exchanges (Binance, OKX)

- [x] **Task 6: Add Integration Tests**
  - [x] Test manual sync endpoint with valid connection
  - [x] Test sync error handling
  - [x] Test last_sync_at update after successful sync
  - [x] Test delete confirmation flow

## Dev Notes

### Architecture Pattern: Connections Hub

This story builds upon the **ExchangeProvider** pattern established in stories 5.1 and 5.2. The connections page acts as a centralized management hub where users can:

1. **View All Connections**: See all configured exchanges at a glance
2. **Monitor Sync Health**: Track when data was last refreshed
3. **Manual Control**: Trigger on-demand syncs or remove connections
4. **Onboarding**: Easy discovery of supported exchanges

### Key Implementation Details

#### Database Schema Update

```sql
-- Migration: 20260130_add_last_sync_to_connections.sql
ALTER TABLE user_connections
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN user_connections.last_sync_at IS 'Timestamp of last successful balance sync';
```

#### Backend Service Pattern

The `ExchangeSyncService` should update the `last_sync_at` timestamp after every successful sync:

```typescript
// In ExchangeSyncService.sync()
await this.supabase
  .from("user_connections")
  .update({ last_sync_at: new Date().toISOString() })
  .eq("id", connectionId);
```

#### Rate Limiting & Safety

To prevent users from spamming the "Sync Now" button and triggering external API bans (Binance/OKX), implement a strict `ThrottlerGuard` on the manual sync endpoint.

**Config:** 1 request per 60 seconds per connection per user.

#### API Response Envelope

The new sync endpoint **MUST** return the standard envelope pattern to ensure frontend consistency:

```typescript
@Post(':id/sync')
async syncOne(@Param('id') id: string): Promise<ApiResponse<ConnectionDto>> {
  // ...
  return { success: true, data: dto, meta: { ... } };
}
```

#### Frontend Hook Enhancement

The `useConnections` hook should expose a `syncConnection` mutation:

```typescript
const syncConnection = useMutation({
  mutationFn: (connectionId: string) => api.post(`/connections/${connectionId}/sync`),
  onSuccess: () => {
    queryClient.invalidateQueries(["connections"]);
    toast.success("Sync completed successfully");
  },
  onError: (error) => {
    toast.error("Sync failed: " + error.message);
  },
});
```

#### UX: Staleness Indicators

Follow the "Calm" design pattern from `project-context.md`:

- **Fresh Data** (&lt;5min): Green dot indicator
- **Stale Data** (≥5min): Amber badge with "Last synced X ago"
- **Never Synced**: Grey state with "Not synced yet"

Use the existing `useStaleness(timestamp)` hook from the project.

### Project Structure Notes

#### Files to Create

- `supabase/migrations/20260130_add_last_sync_to_connections.sql`

#### Files to Modify

- `packages/shared-types/src/api/connection.dto.ts` - Add `lastSyncAt` field
- `packages/shared-types/src/database/supabase-types.ts` - Regenerate after migration
- `services/api/src/crypto/connections.controller.ts` - Add `POST /connections/:id/sync`
- `services/api/src/crypto/connections.service.ts` - Add `syncOne()` method
- `services/api/src/crypto/exchange-sync.service.ts` - Update `last_sync_at` after sync
- `apps/web/src/features/connections/components/connection-card.tsx` - Add sync button & last sync display
- `apps/web/src/features/connections/hooks/use-connections.ts` - Add `syncConnection` mutation
- `apps/web/src/app/(protected)/connections/page.tsx` - Enhance empty state

#### Alignment with Project Structure

- ✅ Feature-based UI: All components in `apps/web/src/features/connections/`
- ✅ Shared types: DTOs defined in `@workspace/shared-types`
- ✅ Co-located tests: `*.spec.ts` files alongside services
- ✅ Domain-based backend: All logic in `services/api/src/crypto/`

### References

- [Source: _bmad-output/epics.md#Epic 5: Automated Exchange Sync & Connections]
- [Source: _bmad-output/project-context.md#UX & "Calm" Design Rules]
- [Source: _bmad-output/architecture.md#Crypto Integration Architecture]
- [Previous Story: 5-2-okx-api-sync-read-only.md] - ExchangeProvider pattern established
- [Previous Story: 5-1-binance-api-sync-read-only.md] - ExchangeRegistry and ConnectionsService

### Testing Standards

From `project-context.md`:

- **Co-location**: Place tests alongside source code
- **Frontend**: Use Vitest + @testing-library/react
- **Backend**: Use Jest + NestJS testing modules
- **Mocking**: Mock at API client level, not hook level

#### Critical Test Cases

1. Sync endpoint updates `last_sync_at` on success
2. Sync endpoint returns error on invalid connection
3. Frontend displays staleness badge when &gt;5min
4. Delete confirmation prevents accidental removal
5. Manual sync invalidates queries and refreshes UI

### Previous Story Intelligence

From **Story 5.2: OKX API Sync**:

**Learnings Applied:**

1. **ExchangeProvider Pattern**: Use `ExchangeRegistry` for provider-agnostic operations
2. **Dynamic UI Configuration**: Use `EXCHANGE_CONFIG` map for provider-specific UI (icons, colors)
3. **Type Safety**: Avoid `any` casts; use proper type assertions with nullish coalescing
4. **Security**: Never expose encrypted secrets in DTOs
5. **Comprehensive Testing**: Mock external dependencies (CCXT) properly

**Code Patterns Established:**

- `ConnectionsService.toDto()` for safe data transformation
- `ConnectionCard` component with dynamic provider config
- `useConnections` hook for data fetching and mutations
- `ExchangeSyncService` for balance synchronization logic

**Architecture Decisions:**

- Passphrase encrypted in database for OKX
- Registry pattern for easy addition of new exchanges
- Frontend form dynamically shows required fields per exchange

### Latest Technical Information

**TanStack Query v5** (Current Version):

- Use `queryClient.invalidateQueries()` after mutations
- `useMutation` returns `mutate`, `mutateAsync`, `isPending`, `isError`, `isSuccess`
- Prefer optimistic updates for better UX

**Radix UI/Shadcn Patterns**:

- Use `AlertDialog` for delete confirmation
- Use `Button` with `variant="outline"` for secondary actions
- Use `Badge` component for staleness indicators

**Next.js 16.1 (App Router)**:

- Server Components by default
- Use `"use client"` for interactive components (connections page needs this)
- Protected routes use auth middleware

---

## Dev Agent Record

### Agent Model Used

Gemini 3 Pro

### Debug Log References

- Initialized: 2026-01-30
- Task 1: Verified existing `last_synced_at` column and DTO mapping. No migration needed.
- Task 2: Implemented `POST /connections/:id/sync` with rate limiting. Added unit tests for controller.
- Task 3, 4, 5: Implemented frontend components and hooks. Replaced disabled `connection-card.tsx` with enhanced implementation.
- Task 6: Added comprehensive frontend test for `ConnectionCard`. Verified backend tests for sync logic.

### Completion Notes List

- Implemented manual sync endpoint with strict rate limiting (1 req/60s).
- Reused existing `last_synced_at` column in `user_connections` instead of creating `last_sync_at` to avoid redundancy.
- Enhanced Connections Page with empty state and grid layout.
- Added `useSyncConnection` hook with cache invalidation.
- Fully implemented `ConnectionCard` with staleness indicator using `useStaleness` hook.
- All acceptance criteria met and verified with tests.

**Code Review Fixes Applied (2026-02-01):**

- Fixed financial precision violation: Replaced `parseFloat()` with `Decimal.toNumber()` in `ExchangeSyncService.createSyncTransaction()`.
- Added test coverage for stale badge display in `ConnectionCard.test.tsx`.
- Removed dead code: Deleted unused `ConnectionsService.sync()` method.
- Improved type consistency: Updated controller return types to use `ApiResponse<T>` interface.
- Updated File List with missing files: `exchange-sync.service.ts` and `connection.dto.ts`.

### File List

- services/api/src/crypto/connections.controller.ts
- services/api/src/crypto/connections.service.ts
- services/api/src/crypto/exchange-sync.service.ts
- services/api/src/crypto/exchange-sync.service.spec.ts
- services/api/src/crypto/connections.controller.spec.ts
- packages/shared-types/src/api/connection.dto.ts
- apps/web/src/features/connections/components/connection-card.tsx
- apps/web/src/features/connections/hooks/use-connections.ts
- apps/web/src/features/connections/components/connection-card.test.tsx
- apps/web/src/app/(protected)/connections/page.tsx
- apps/web/src/api/client.ts
