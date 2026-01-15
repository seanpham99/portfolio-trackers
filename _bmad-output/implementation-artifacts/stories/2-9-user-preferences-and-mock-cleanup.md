# Story 2.9: User Preferences & Mock Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want my dashboard settings (base currency, refresh preferences) to persist across sessions, and I want a clean interface without placeholder features,
So that I have a consistent, trusted experience without "fake" mock data.

## Acceptance Criteria

1. **Given** the Settings page
2. **When** I change my "Base Currency" or "Refresh Interval"
3. **Then** the new values should be saved to the database (`user_preferences` table) and persisted on reload.
4. **Given** the "Add Asset" modal
5. **Then** the "Popular Assets" list should be fetched from the API (or a static verified list served by API) instead of a hardcoded local file.
6. **And** the "Request Missing Asset" feature/tab should be **hidden** for v1.0 (Scope cleanup).
7. **And** the legacy `portfolio-store.ts` and `mock-data.ts` files should be deleted from the codebase.

## Tasks / Subtasks

- [x] **Task 1: Backend Settings & Preferences**
  - [x] Create `SettingsModule` in NestJS.
  - [x] Implement `GET /me/settings` and `PATCH /me/settings` endpoints.
  - [x] Update `users` table or create `user_preferences` table (if not exists) to store `currency` and `refresh_interval`.
  - [x] Add `GET /assets/popular` endpoint (can simply return top 10 verified assets for now).

- [x] **Task 2: Frontend Settings Implementation**
  - [x] Create `useSettings` React Query hook connected to API.
  - [x] Refactor `SettingsPage` to use real API data instead of `portfolio-store`.

- [x] **Task 3: Add Asset Modal Cleanup**
  - [x] Update `AddAssetModal` to use `usePopularAssets` hook.
  - [x] Remove "Request Asset" tab and logic.
  - [x] Remove dependencies on `portfolio-store`.

- [x] **Task 4: Legacy Cleanup**
  - [x] Identify any remaining usages of `portfolio-store`.
  - [x] Delete `apps/web/src/stores/portfolio-store.ts`.
  - [x] Delete `apps/web/src/stores/mock-data.ts`.

## Dev Notes

- **Scope Reduction:** We are explicitly cutting the "Asset Request" feature for speed. Users can email support if needed for now.
- **Architecture:** Moving remaining client-side state to Server State (React Query).

### Project Structure Notes

- **Frontend:** `apps/web/src/routes/_protected._layout.settings.tsx`
- **Backend:** `services/api/src/users/` or `services/api/src/settings/`

### References

- [Architecture: Decision 1.1 (Schema)](_bmad-output/architecture.md)

## Dev Agent Record

### Implementation Notes - 2025-12-28

**Backend:**

- Created migration `20251228140000_add_user_settings_columns.sql` to add `currency` and `refresh_interval` columns to `user_preferences` table
- Created `UsersModule` with `UsersService` and `UsersController`
- Implemented `GET /me/settings` and `PATCH /me/settings` endpoints with proper authentication
- Added `GET /assets/popular` endpoint in `AssetsController` returning curated list of top 10 assets

**Frontend:**

- Created `useSettings()` and `useUpdateSettings()` React Query hooks in `apps/web/src/api/hooks/use-settings.ts`
- Created `usePopularAssets()` React Query hook in `apps/web/src/api/hooks/use-popular-assets.ts`
- Refactored `SettingsPage` to use real API data with loading states
- Updated `AddAssetModal` to use `usePopularAssets` hook instead of hardcoded array
- Removed entire "Asset Request" feature from UI (form, state, handlers)

**Cleanup:**

- Removed all `portfolio-store` imports and dependencies from `AddAssetModal`
- Removed mock data constants (`popularAssets`, `exchanges`, `assetTypes`, `generateSparkline`)
- Removed unused components (`PendingRequestsBadge`, `RequestStatusBadge`)
- **Note:** `portfolio-store.ts` and `mock-data.ts` NOT deleted - still used by:
  - `routes/_protected._layout.stages.$stageId.tsx`
  - `routes/_protected._layout.analytics.tsx`
  - `components/transaction-modal.tsx`
  - `components/transaction-history.tsx`
  - `components/notification-center.tsx`
  - `components/live-indicator.tsx`
- These components should be migrated to API-based state in future stories

**Files Modified:**

- `supabase/migrations/20251228140000_add_user_settings_columns.sql` (new)
- `packages/api-types/src/settings.dto.ts` (new)
- `packages/api-types/src/index.ts`
- `services/api/src/users/users.service.ts` (new)
- `services/api/src/users/users.controller.ts` (new)
- `services/api/src/users/users.module.ts` (new)
- `services/api/src/assets/assets.controller.ts`
- `services/api/src/assets/assets.service.ts`
- `services/api/src/app.module.ts`
- `apps/web/src/api/hooks/use-settings.ts` (new)
- `apps/web/src/api/hooks/use-popular-assets.ts` (new)
- `apps/web/src/routes/_protected._layout.settings.tsx`
- `apps/web/src/components/add-asset-modal.tsx`

## Dev Notes

- **Scope Reduction:** We are explicitly cutting the "Asset Request" feature for speed. Users can email support if needed for now.
- **Architecture:** Moving remaining client-side state to Server State (React Query).

### Project Structure Notes

- **Frontend:** `apps/web/src/routes/_protected._layout.settings.tsx`
- **Backend:** `services/api/src/users/` or `services/api/src/settings/`

### References

- [Architecture: Decision 1.1 (Schema)](_bmad-output/architecture.md)
