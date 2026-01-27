# Story 5.1: Binance API Sync (Read-Only)

Status: in-progress

## Story

As a user,
I want to connect my Binance account via API keys (read-only),
so that my spot balances are automatically tracked in my unified portfolio.

## Acceptance Criteria

1. **Given** the Connections page at `/connections` (or accessible via settings).
2. **When** I select "Binance" and enter valid **API Key** and **Secret Key** (read-only permissions).
3. **Then** the system validates keys via CCXT → Binance API (real validation, not mock).
4. **Then** the system fetches current SPOT balances (filter dust < $1 USD equivalent).
5. **Then** the system creates/updates `Asset` records (if not existing) with `asset_class: 'crypto'`, `source: 'binance'`.
6. **Then** the system creates "sync" transactions in user's selected portfolio (or auto-create "Binance Sync" portfolio).
7. **Then** the UI displays success toast with synced balance summary.

## Tasks / Subtasks

- [ ] **Task 1: Fix Existing ConnectionsService Encryption (AC: 2,3)**
  - [ ] Update `services/api/src/crypto/connections.service.ts` line 54 to use `encryptSecret()` from `crypto.utils.ts`
  - [ ] Verify `decryptSecret()` works for retrieving keys when syncing
  - [ ] Add unit test for encryption round-trip in `connections.service.spec.ts`

- [ ] **Task 2: Implement BinanceService with CCXT (AC: 3,4)**
  - [ ] Create `services/api/src/crypto/binance.service.ts`
  - [ ] Configure CCXT: `new ccxt.binance({ enableRateLimit: true, timeout: 30000 })`
  - [ ] Implement `validateKeys(apiKey, secret): Promise<ValidationResultDto>` - actually calls `exchange.fetchBalance()`
  - [ ] Implement `fetchBalances(apiKey, secret): Promise<Balance[]>` with Decimal conversion
  - [ ] Filter dust balances: skip assets where USD value < 1.00
  - [ ] Map CCXT errors: `AuthenticationError` → "Invalid credentials", `RateLimitExceeded` → "Rate limited"

- [ ] **Task 3: Update ConnectionsService.validateConnection() (AC: 3)**
  - [ ] Replace mock validation (line 77) with call to `BinanceService.validateKeys()`
  - [ ] Inject `BinanceService` into `ConnectionsService`

- [ ] **Task 4: Implement Sync Logic (AC: 5,6)**
  - [ ] Create `services/api/src/crypto/binance-sync.service.ts`
  - [ ] Implement `syncHoldings(userId, connectionId)`:
    - Decrypt API secret using `decryptSecret()`
    - Fetch balances via `BinanceService.fetchBalances()`
    - For each balance: upsert `Asset` (symbol, name from CCXT markets, `asset_class: 'crypto'`)
    - Create "SYNC" type transaction in user's portfolio (quantity = current balance)
  - [ ] Handle portfolio selection: use user's first portfolio or create "Binance Sync" portfolio

- [ ] **Task 5: Create/Update API Endpoints (AC: 2,3,6,7)**
  - [ ] Verify existing endpoints in `services/api/src/crypto/connections.controller.ts`
  - [ ] Ensure `POST /api/v1/connections` calls real validation + initial sync
  - [ ] Add sync results to response: `{ success, data: ConnectionDto, meta: { assetsSync: number } }`
  - [ ] Ensure envelope pattern: `{ success: boolean, data, error, meta }`

- [ ] **Task 6: Frontend BinanceConnectionForm (AC: 2,7)**
  - [ ] Create `apps/web/src/features/connections/components/binance-connection-form.tsx`
  - [ ] Use existing `CreateConnectionDto` from `@workspace/shared-types/api`
  - [ ] Zod validation matching backend DTO
  - [ ] States: idle → validating (spinner) → success (toast + redirect) / error (toast)
  - [ ] Show synced balance preview before final confirm (optional enhancement)

- [ ] **Task 7: Add Connections Page Route (AC: 1)**
  - [ ] Create `apps/web/src/app/connections/page.tsx` (basic, Story 5.3 will enhance)
  - [ ] Import existing `ConnectionDto` for type safety
  - [ ] List existing connections with status badges
  - [ ] "Add Binance" button → opens form modal/drawer

- [ ] **Task 8: Error Handling & Resilience (AC: 3)**
  - [ ] Implement exponential backoff wrapper for CCXT calls (check if exists in `common/`)
  - [ ] Return "Calm" error responses: user-friendly messages, no stack traces
  - [ ] Log errors to console with context (userId, exchange, error code)

## Dev Notes

### Existing Infrastructure (DO NOT RECREATE)
- **DTOs**: `@workspace/shared-types/api/connection.dto.ts` - `CreateConnectionDto`, `ConnectionDto`, `ValidationResultDto`
- **Enums**: `ExchangeId.binance`, `ConnectionStatus` from `@workspace/shared-types/database`
- **DB Table**: `user_connections` with `api_secret_encrypted` field
- **Service**: `services/api/src/crypto/connections.service.ts` - needs encryption fix
- **Crypto Utils**: `services/api/src/crypto/crypto.utils.ts` - `encryptSecret()`, `decryptSecret()`, `maskApiKey()`

### CCXT Configuration
```typescript
const exchange = new ccxt.binance({
  apiKey,
  secret,
  enableRateLimit: true,
  timeout: 30000,
  options: { adjustForTimeDifference: true }
});
```

### Error Mapping
| CCXT Error | User Message |
|------------|--------------|
| `AuthenticationError` | "Invalid API credentials. Check your key and secret." |
| `RateLimitExceeded` | "Too many requests. Please wait a moment." |
| `NetworkError` | "Unable to connect to Binance. Check your network." |
| `ExchangeNotAvailable` | "Binance is temporarily unavailable." |

### Security Requirements
- API secrets encrypted via AES-256-GCM before storage
- Secrets NEVER returned in API responses (use `maskApiKey()`)
- RLS enforces `user_id` filtering on `user_connections` table

### Project Structure
```
services/api/src/crypto/
├── binance.service.ts        # NEW: CCXT wrapper
├── binance-sync.service.ts   # NEW: Sync orchestration
├── connections.service.ts    # MODIFY: Fix encryption
├── connections.controller.ts # EXISTS: Verify endpoints
├── crypto.utils.ts           # EXISTS: Encryption helpers
└── crypto.module.ts          # MODIFY: Register new services

apps/web/src/features/connections/
├── components/
│   └── binance-connection-form.tsx  # NEW
├── hooks/
│   └── use-connections.ts           # NEW: TanStack Query
└── index.ts                         # NEW: Feature exports

apps/web/src/app/connections/
└── page.tsx                         # NEW: Route
```

### References
- [Architecture](file:///_bmad-output/architecture.md#Core-Architectural-Decisions): CCXT 4.5.29, Supabase RLS
- [Project Context](file:///_bmad-output/project-context.md#Critical-Implementation-Rules): Financial precision, envelope pattern
- [CCXT Binance Docs](https://docs.ccxt.com/#/exchanges/binance)
- [Existing Service](file:///services/api/src/crypto/connections.service.ts): Line 54 needs encryption fix

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
