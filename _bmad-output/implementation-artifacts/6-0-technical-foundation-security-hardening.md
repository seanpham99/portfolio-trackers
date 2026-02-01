# Story 6.0: Technical Foundation & Security Hardening

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to migrate our secrets management to Supabase Vault and implement shared validation logic,
so that our security and tier-enforcement mechanisms are robust enough for payment processing.

## Acceptance Criteria

1. **Given** the database setup.
2. **When** I deploy the Supabase Vault extension.
3. **Then** existing encrypted keys are migrated to Vault secrets, and new keys use Vault automatically.
4. **Given** the "Freemium" limits.
5. **When** I define validation rules (e.g., "Max 20 assets").
6. **Then** these rules are enforced identically on both Backend (API) and Frontend (UI) using a shared library/schema.

## Tasks / Subtasks

- [ ] **Task 1: Deploy and Configure Supabase Vault Extension** (AC: #1, #2, #3)
  - [ ] Subtask 1.1: Enable Supabase Vault extension via Dashboard or SQL migration
  - [ ] Subtask 1.2: Create migration script to read existing `api_secret_encrypted` values
  - [ ] Subtask 1.3: Create `vault.store_secret()` wrapper function in Supabase
  - [ ] Subtask 1.4: Create `vault.fetch_secret()` wrapper function in Supabase
  - [ ] Subtask 1.5: Migrate existing connection secrets from encrypted columns to Vault
- [ ] **Task 2: Update Backend Connections Service to Use Vault** (AC: #3)
  - [ ] Subtask 2.1: Refactor `ConnectionsService.createConnection()` to call `vault.store_secret()`
  - [ ] Subtask 2.2: Refactor `ConnectionsService.getDecryptedCredentials()` to call `vault.fetch_secret()`
  - [ ] Subtask 2.3: Update unit tests to mock Vault calls
  - [ ] Subtask 2.4: Add error handling for Vault unavailability (graceful fallback logging)
- [ ] **Task 3: Create Shared Validation Package** (AC: #4, #5, #6)
  - [ ] Subtask 3.1: Define `TierLimits` interface in `@workspace/shared-types/src/validation/tier-limits.ts`
  - [ ] Subtask 3.2: Implement Zod schemas for `FREE_TIER` and `PRO_TIER` limits
  - [ ] Subtask 3.3: Export validation functions (`validatePortfolioCount`, `validateAssetCount`)
  - [ ] Subtask 3.4: Add unit tests for validation logic
- [ ] **Task 4: Implement Backend Validation Guards** (AC: #6)
  - [ ] Subtask 4.1: Create `TierValidationGuard` in `services/api/src/common/guards/`
  - [ ] Subtask 4.2: Apply guard to `POST /portfolios` and `POST /assets` endpoints
  - [ ] Subtask 4.3: Return `403 Forbidden` with upgrade message when limits exceeded
  - [ ] Subtask 4.4: Add integration tests for tier enforcement
- [ ] **Task 5: Implement Frontend Validation** (AC: #6)
  - [ ] Subtask 5.1: Import shared validation from `@workspace/shared-types/validation`
  - [ ] Subtask 5.2: Add pre-submit checks in `CreatePortfolioDialog` and `AddAssetDialog`
  - [ ] Subtask 5.3: Display upgrade modal when limits are reached
  - [ ] Subtask 5.4: Add visual indicators (e.g., "2/20 assets used") in UI
- [ ] **Task 6: Testing & Verification** (AC: All)
  - [ ] Subtask 6.1: Unit test Vault integration (create/fetch secrets)
  - [ ] Subtask 6.2: Integration test full connection flow with Vault
  - [ ] Subtask 6.3: Unit test shared validation functions
  - [ ] Subtask 6.4: E2E test: Try to bypass frontend validation by directly calling API
  - [ ] Subtask 6.5: Manual verification: Test secret migration with actual Binance/OKX keys

## Dev Notes

### 🔐 **CRITICAL SECURITY RATIONALE**

This story is the **gatekeeper** for Epic 6's payment features. Storing API keys securely via Supabase Vault (instead of app-side encryption) is **mandatory** before processing real money. The shared validation prevents users from bypassing "Free Tier" limits by manipulating the frontend and directly calling the API.

---

### **Part 1: Supabase Vault Migration**

#### **Current State (from Epic 5)**

Currently, Exchange API secrets are encrypted **in the application layer** using AES-256-GCM and stored in `user_connections.api_secret_encrypted` (plain text column containing encrypted Base64 strings). The encryption key is stored in environment variables (`ENCRYPTION_KEY`).

**Files:**

- `services/api/src/crypto/crypto.utils.ts` - `encryptSecret()` / `decryptSecret()`
- `services/api/src/crypto/connections.service.ts` - Uses `encryptSecret()` when saving

**Problem:**

- Encryption key is accessible to the application process, increasing attack surface.
- Backup/replication streams expose encrypted keys (albeit encrypted, but still in the same DB).
- Does not meet the security bar for payment processing (PCI DSS considerations).

#### **Target State (with Supabase Vault)**

Vault provides **Transparent Data Encryption (TDE)** at the PostgreSQL level using `pgsodium`. Secrets are encrypted on-disk, and decryption happens only within SQL functions/views.

**Benefits:**

- Encryption key is managed by Supabase/PostgreSQL (not accessible to app code).
- Backups/replicas maintain encryption.
- Meets industry standards for secure secret storage.

#### **Implementation Guide: Supabase Vault**

**Step 1: Enable Vault Extension**

Via Supabase Dashboard → Database → Extensions → Enable "Vault"

Or via SQL Migration:

```sql
-- File: services/api/supabase/migrations/YYYYMMDD_enable_vault.sql
CREATE EXTENSION IF NOT EXISTS vault;
```

**Step 2: Create Vault Wrapper Functions**

Supabase Vault provides `vault.create_secret()` and reads via the `vault.decrypted_secrets` view. We'll create helper functions for easier integration.

```sql
-- File: services/api/supabase/migrations/YYYYMMDD_vault_helpers.sql

-- Store a secret in Vault
CREATE OR REPLACE FUNCTION public.store_connection_secret(
  p_user_id UUID,
  p_connection_id UUID,
  p_secret_type TEXT, -- 'api_secret' or 'passphrase'
  p_secret_value TEXT
) RETURNS UUID AS $$
DECLARE
  v_secret_id UUID;
  v_secret_name TEXT;
BEGIN
  -- Generate unique secret name
  v_secret_name := format('connection_%s_%s_%s', p_connection_id, p_user_id, p_secret_type);

  -- Store in Vault
  SELECT vault.create_secret(p_secret_value, v_secret_name) INTO v_secret_id;

  RETURN v_secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fetch a secret from Vault
CREATE OR REPLACE FUNCTION public.fetch_connection_secret(
  p_secret_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_decrypted TEXT;
BEGIN
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;

  RETURN v_decrypted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3: Update Schema**

Add columns to store Vault secret IDs and mark the migration status:

```sql
-- File: services/api/supabase/migrations/YYYYMMDD_connections_vault_columns.sql

ALTER TABLE user_connections
ADD COLUMN api_secret_vault_id UUID REFERENCES vault.decrypted_secrets(id),
ADD COLUMN passphrase_vault_id UUID REFERENCES vault.decrypted_secrets(id),
ADD COLUMN vault_migrated BOOLEAN DEFAULT FALSE;

-- Index for faster lookups
CREATE INDEX idx_user_connections_vault_migrated ON user_connections(vault_migrated);
```

**Step 4: Data Migration Script**

Migrate existing encrypted secrets to Vault:

```sql
-- File: services/api/supabase/migrations/YYYYMMDD_migrate_secrets_to_vault.sql

DO $$
DECLARE
  conn RECORD;
  v_plaintext_api_secret TEXT;
  v_plaintext_passphrase TEXT;
  v_api_vault_id UUID;
  v_pass_vault_id UUID;
BEGIN
  FOR conn IN
    SELECT id, user_id, api_secret_encrypted, passphrase_encrypted
    FROM user_connections
    WHERE vault_migrated = FALSE
      AND api_secret_encrypted IS NOT NULL
  LOOP
    -- IMPORTANT: This migration assumes you have a way to decrypt existing secrets
    -- Option A: Temporarily expose decryptSecret() via a Supabase Function
    -- Option B: Run this migration from NestJS where decryptSecret() exists

    -- For now, we'll assume the NestJS approach:
    -- This SQL is a template; actual migration runs via TypeScript

    -- Store API secret in Vault
    SELECT public.store_connection_secret(
      conn.user_id,
      conn.id,
      'api_secret',
      v_plaintext_api_secret -- decrypted value from app
    ) INTO v_api_vault_id;

    -- Store passphrase if exists
    IF conn.passphrase_encrypted IS NOT NULL THEN
      SELECT public.store_connection_secret(
        conn.user_id,
        conn.id,
        'passphrase',
        v_plaintext_passphrase -- decrypted value from app
      ) INTO v_pass_vault_id;
    END IF;

    -- Update connection record
    UPDATE user_connections
    SET api_secret_vault_id = v_api_vault_id,
        passphrase_vault_id = v_pass_vault_id,
        vault_migrated = TRUE
    WHERE id = conn.id;
  END LOOP;
END $$;
```

**Step 5: Backend Service Refactor**

Update `ConnectionsService` to use Vault:

```typescript
// File: services/api/src/crypto/connections.service.ts

async createConnection(userId: string, dto: CreateConnectionDto) {
  // OLD:
  // api_secret_encrypted: encryptSecret(apiSecret)

  // NEW:
  const { data: apiVaultId } = await this.supabase.rpc('store_connection_secret', {
    p_user_id: userId,
    p_connection_id: newConnectionId,
    p_secret_type: 'api_secret',
    p_secret_value: dto.apiSecret,
  });

  return this.supabase.from('user_connections').insert({
    ...
    api_secret_vault_id: apiVaultId,
    vault_migrated: true,
  });
}

async getDecryptedCredentials(connectionId: string) {
  const { data: conn } = await this.supabase
    .from('user_connections')
    .select('api_secret_vault_id, passphrase_vault_id')
    .eq('id', connectionId)
    .single();

  const { data: apiSecret } = await this.supabase.rpc('fetch_connection_secret', {
    p_secret_id: conn.api_secret_vault_id,
  });

  return { apiKey: conn.api_key, apiSecret };
}
```

**Step 6: Deprecate Old Encryption**

- Keep `crypto.utils.ts` for backward compatibility during migration.
- Once all secrets are migrated, remove `api_secret_encrypted` column in a future migration.
- Delete `encryptSecret()` / `decryptSecret()` functions.

---

### **Part 2: Shared Validation for Tier Enforcement**

#### **Current State**

No tier limits are enforced. Users can create unlimited portfolios and assets.

#### **Target State**

- **Free Tier**: 1 portfolio, 20 assets max
- **Pro Tier**: Unlimited portfolios and assets

Validation logic must be **identical** on Frontend (UX) and Backend (Security).

#### **Implementation Guide: Shared Validation**

**Step 1: Define Tier Limits in Shared Types**

```typescript
// File: packages/shared-types/src/validation/tier-limits.ts

export interface TierLimits {
  maxPortfolios: number;
  maxAssets: number;
}

export const FREE_TIER: TierLimits = {
  maxPortfolios: 1,
  maxAssets: 20,
};

export const PRO_TIER: TierLimits = {
  maxPortfolios: Infinity,
  maxAssets: Infinity,
};

export function getTierLimits(tier: "free" | "pro"): TierLimits {
  return tier === "pro" ? PRO_TIER : FREE_TIER;
}
```

**Step 2: Create Validation Functions**

```typescript
// File: packages/shared-types/src/validation/tier-validation.ts

import { z } from "zod";
import { FREE_TIER, PRO_TIER } from "./tier-limits.js";

export const TierValidationError = z.object({
  code: z.literal("TIER_LIMIT_EXCEEDED"),
  message: z.string(),
  limit: z.number(),
  current: z.number(),
});

export type TierValidationError = z.infer<typeof TierValidationError>;

export function validatePortfolioCount(
  currentCount: number,
  tier: "free" | "pro"
): { valid: boolean; error?: TierValidationError } {
  const limits = tier === "pro" ? PRO_TIER : FREE_TIER;

  if (currentCount >= limits.maxPortfolios) {
    return {
      valid: false,
      error: {
        code: "TIER_LIMIT_EXCEEDED",
        message: `${tier.toUpperCase()} tier allows maximum ${limits.maxPortfolios} portfolio(s). Upgrade to PRO for unlimited.`,
        limit: limits.maxPortfolios,
        current: currentCount,
      },
    };
  }

  return { valid: true };
}

export function validateAssetCount(
  currentCount: number,
  tier: "free" | "pro"
): { valid: boolean; error?: TierValidationError } {
  const limits = tier === "pro" ? PRO_TIER : FREE_TIER;

  if (currentCount >= limits.maxAssets) {
    return {
      valid: false,
      error: {
        code: "TIER_LIMIT_EXCEEDED",
        message: `${tier.toUpperCase()} tier allows maximum ${limits.maxAssets} assets. Upgrade to PRO for unlimited.`,
        limit: limits.maxAssets,
        current: currentCount,
      },
    };
  }

  return { valid: true };
}
```

**Step 3: Backend Guard**

```typescript
// File: services/api/src/common/guards/tier-validation.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import {
  validatePortfolioCount,
  validateAssetCount,
} from "@workspace/shared-types/validation/tier-validation.js";
import { UsersService } from "../../users/users.service.js";
import { PortfoliosService } from "../../portfolios/portfolios.service.js";

@Injectable()
export class TierValidationGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private portfoliosService: PortfoliosService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id; // from AuthGuard
    const endpoint = request.route.path;

    const user = await this.usersService.findOne(userId);
    const tier = user.subscription_tier || "free";

    if (endpoint.includes("/portfolios") && request.method === "POST") {
      const currentCount = await this.portfoliosService.countByUser(userId);
      const validation = validatePortfolioCount(currentCount, tier);

      if (!validation.valid) {
        throw new ForbiddenException(validation.error);
      }
    }

    if (endpoint.includes("/assets") && request.method === "POST") {
      const currentCount = await this.portfoliosService.countAssetsByUser(userId);
      const validation = validateAssetCount(currentCount, tier);

      if (!validation.valid) {
        throw new ForbiddenException(validation.error);
      }
    }

    return true;
  }
}
```

**Step 4: Apply Guard to Controllers**

```typescript
// File: services/api/src/portfolios/portfolios.controller.ts

@Controller("portfolios")
@UseGuards(AuthGuard, TierValidationGuard) // Apply tier check
export class PortfoliosController {
  @Post()
  async create(@Body() dto: CreatePortfolioDto) {
    // Guard ensures we never reach here if limit exceeded
  }
}
```

**Step 5: Frontend Validation**

```typescript
// File: apps/web/src/features/portfolio/components/create-portfolio-dialog.tsx

import { validatePortfolioCount } from '@workspace/shared-types/validation/tier-validation';
import { useUser } from '@/hooks/use-user';
import { usePortfolios } from '@/hooks/use-portfolios';

export function CreatePortfolioDialog() {
  const { data: user } = useUser();
  const { data: portfolios } = usePortfolios();

  const validation = validatePortfolioCount(
    portfolios?.length || 0,
    user?.subscription_tier || 'free',
  );

  if (!validation.valid) {
    return <UpgradeModal error={validation.error} />;
  }

  return <CreateForm />;
}
```

---

### Project Structure Notes

#### **Files to Create**

**Supabase Migrations:**

- `services/api/supabase/migrations/YYYYMMDD_enable_vault.sql`
- `services/api/supabase/migrations/YYYYMMDD_vault_helpers.sql`
- `services/api/supabase/migrations/YYYYMMDD_connections_vault_columns.sql`
- `services/api/supabase/migrations/YYYYMMDD_migrate_secrets_to_vault.sql`

**Shared Validation:**

- `packages/shared-types/src/validation/tier-limits.ts`
- `packages/shared-types/src/validation/tier-validation.ts`
- `packages/shared-types/src/validation/index.ts` (export barrel)

**Backend:**

- `services/api/src/common/guards/tier-validation.guard.ts`
- `services/api/src/common/guards/tier-validation.guard.spec.ts`
- `services/api/src/users/users.service.ts` (if not exists, for tier lookup)

**Frontend:**

- `apps/web/src/components/upgrade-modal.tsx`
- `apps/web/src/hooks/use-tier-limits.ts`

#### **Files to Modify**

**Backend:**

- `services/api/src/crypto/connections.service.ts` (replace encrypt/decrypt with Vault calls)
- `services/api/src/crypto/connections.service.spec.ts` (update tests)
- `services/api/src/portfolios/portfolios.controller.ts` (add guard)
- `services/api/src/assets/assets.controller.ts` (add guard)
- `services/api/src/portfolios/portfolios.service.ts` (add `countByUser()`, `countAssetsByUser()`)

**Frontend:**

- `apps/web/src/features/portfolio/components/create-portfolio-dialog.tsx`
- `apps/web/src/features/assets/components/add-asset-dialog.tsx`

**Shared:**

- `packages/shared-types/src/index.ts` (export validation module)
- `packages/shared-types/package.json` (ensure Zod is a dependency)

---

### References

- [Source: _bmad-output/architecture.md#Secrets Management]
- [Source: _bmad-output/project-context.md#Security & Infrastructure Rules]
- [Source: _bmad-output/epics.md#Story 6.0]
- [Source: _bmad-output/implementation-artifacts/epic-5-retrospective.md#Critical Preparation Blocks]
- [Supabase Vault Official Docs](https://supabase.com/docs/guides/database/vault)
- [Supabase Vault API Reference](https://supabase.com/docs/guides/database/extensions/vault)

---

### Testing Standards

#### **Unit Tests**

- **Vault Integration**: Mock Supabase `.rpc()` calls. Verify `store_connection_secret()` and `fetch_connection_secret()` are called with correct params.
- **Shared Validation**: Test `validatePortfolioCount()` and `validateAssetCount()` with edge cases (0, 1, 19, 20, 21 for Free tier).
- **Tier Guard**: Mock `UsersService` and `PortfoliosService`. Verify `ForbiddenException` is thrown when limits exceeded.

#### **Integration Tests**

- **Full Connection Flow**: Create connection → Store in Vault → Fetch credentials → Decrypt successfully.
- **Tier Enforcement**: Attempt to create 2nd portfolio as Free user → Verify 403 response.
- **Bypass Attempt**: Mock authenticated Free user → Call `POST /portfolios` directly (not via UI) → Verify rejection.

#### **E2E Tests (Playwright)**

- **User Journey**: Free user creates 20 assets → Attempts 21st → Sees upgrade modal → Cannot create asset.
- **Security Validation**: Verify that modifying frontend validation logic does NOT allow bypassing backend guard.

---

### Known Limitations \u0026 Future Considerations

1. **Migration Downtime**: Vault migration requires decrypting existing secrets in-memory. For production, schedule during low-traffic window.
2. **Vault Performance**: Supabase Vault decryption happens on-demand. For high-frequency access, consider caching decrypted secrets in Redis (with TTL).
3. **Rollback Strategy**: Keep `api_secret_encrypted` column for 1-2 release cycles. If Vault fails, fallback logic can temporarily use old encryption.
4. **Admin Override**: Consider adding an `admin_bypass` flag for testing or emergency access (use with extreme caution).

---

### Previous Story Intelligence

From **Story 5.4: Background Sync & Polling**:

- The `ConnectionsService` is already mature with methods like `findAllActive()`.
- We use `ExchangeSyncService.syncHoldings(userId, connectionId)` which fetches credentials via `getDecryptedCredentials()`.
- **Critical**: Any changes to `getDecryptedCredentials()` must be backward-compatible until all connections are migrated.

**Learnings:**

- The scheduler calls services directly, bypassing controllers, so tier validation guards on controllers won't affect background jobs (this is correct/intended).
- Ensure Vault migration handles `null` passphrases gracefully (OKX doesn't require passphrase, Binance does).

---

### Latest Technical Information (Web Research 2026-02-01)

**Supabase Vault Status:**

- Vault's internal implementation may migrate away from standalone `pgsodium` extension, but the **Vault API surface is confirmed stable**.
- New API key format: `sb_publishable_*` (frontend) and `sb_secret_*` (backend) replacing legacy `anon` and `service_role` keys. Migration deadline: **late 2026**.
- Authenticated Encryption (AES-256-GCM equivalent at PostgreSQL level) is maintained in backups/replication.

**Best Practices:**

- Always use `SECURITY DEFINER` for Vault wrapper functions to enforce RLS.
- Never expose Vault secret IDs to the frontend; they should only exist in backend logic.
- Use Supabase CLI (`supabase secrets set`) for non-database secrets (e.g., Edge Function env vars).

**Zod Version (Shared Validation):**

- Latest stable: `v3.24.1` (Jan 2026). Ensure `packages/shared-types/package.json` specifies `^3.24.0`.

---

## Dev Agent Record

### Agent Model Used

_Pending Dev Story Execution_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after Task 6 verification_

### File List

_To be generated by dev agent during implementation_
