# Story 2.7: Connection Management (API Keys & OAuth)

Status: review

## Story

As a User,
I want to manage my API connections to exchanges (Binance, OKX),
So that I can keep my crypto portfolio synced automatically without manual entry.

## Context

**Epic Context:** This story bridges **Epic 2 (Settings UI)** and **Epic 3 (Crypto Automation)**. It builds the foundational "Connections" infrastructure required for Story 3.3 (Auto-Sync).
**Architecture:** Implements **Decision 1.1** (Supabase Schema) and **Decision 4** (Crypto Integration via CCXT).
**Security:** ⚠️ **Architect Decision:** pgsodium is deprecated by Supabase. Using **Node.js crypto AES-256-GCM** for application-level encryption.

## Acceptance Criteria

1. **Given** the Settings > Connections page
   **When** I view the page
   **Then** I should see a list of supported integrations (Binance, OKX) with their current status (Connected/Not Connected)

2. **Given** adding a new connection
   **When** I select "Connect Binance" (or OKX)
   **Then** I should see a secure form asking for API Key and API Secret
   **And** the form should validate the keys immediately using `POST /connections/validate` (ccxt `fetchBalance` check)
   **And** on success, the keys must be stored **encrypted** in the database

3. **Given** a connected exchange
   **When** viewing the list
   **Then** I should see a "Synced" badge with the "Last Synced" timestamp
   **And** I should be able to click "Disconnect" to remove the keys and delete the connection record

4. **Given** the backend storage
   **When** keys are saved
   **Then** the API Secret must NEVER be returned in plaintext in any API response
   **And** the database column for secrets must use AES-256-GCM encryption

5. **Given** invalid keys
   **When** attempting to connect
   **Then** specific error messages from the exchange (via CCXT) should be displayed (e.g., "Invalid Permissions", "IP Restriction")

## Tasks / Subtasks

- [x] **Task 1: Database Schema & Security**
  - [x] Create `user_connections` table in Supabase
  - [x] `crypto.utils.ts` with AES-256-GCM encrypt/decrypt/maskApiKey
  - [x] Unit tests (11/11 passing)

- [x] **Task 3: API Types & Frontend Hooks**
  - [x] DTOs in `@workspace/api-types` (`connection.dto.ts`)
  - [x] React Query hooks (`use-connections.ts`)

- [x] **Task 4: Frontend UI**
  - [x] `/settings/connections` route
  - [x] `IntegrationCard` component with exchange logos
  - [x] `ConnectionModal` with form validation

- [ ] **Task 5: Manual Integration Testing** _(requires real API keys)_
  - [ ] Test with Binance/OKX read-only API keys
  - [ ] Verify encrypted storage in database

## Technical Guidelines

- **Library:** `ccxt` with custom type declarations
- **Encryption:** Node.js `crypto` AES-256-GCM (pgsodium deprecated)
- **Frontend:** `react-hook-form` + `zod` for API Key form

## Dev Agent Record

**Date:** 2025-12-28

**Architect Decision:**

- pgsodium is deprecated by Supabase (pending removal)
- Implemented application-level encryption using Node.js `crypto` module
- Format: `iv:authTag:ciphertext` (base64 encoded)
- Requires `ENCRYPTION_KEY` environment variable (32-byte base64)

**Files Created:**

- `supabase/migrations/20251229000000_create_user_connections.sql`
- `services/api/src/connections/crypto.utils.ts`
- `services/api/src/connections/crypto.utils.spec.ts` (11 tests)
- `services/api/src/connections/connections.service.ts`
- `services/api/src/connections/connections.controller.ts`
- `services/api/src/connections/connections.module.ts`
- `services/api/src/types/ccxt.d.ts`
- `packages/api-types/src/connection.dto.ts`
- `apps/web/src/api/hooks/use-connections.ts`
- `apps/web/src/components/connections/IntegrationCard.tsx`
- `apps/web/src/components/connections/ConnectionModal.tsx`
- `apps/web/src/routes/_protected.settings.connections.tsx`

**Files Modified:**

- `services/api/src/app.module.ts` (added ConnectionsModule)
- `packages/api-types/src/index.ts` (export connection DTOs)
- `apps/web/src/api/client.ts` (added connection API functions)

## References

- [CCXT Manual](https://docs.ccxt.com/)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
