# Story Prep-5.4: Secrets Management & Rotation Policy

Status: backlog

## Story

As a DevOps Engineer,
I want a documented secrets rotation policy,
So that compromised keys can be replaced without downtime.

## Context

**Sprint Context:** Prep Sprint 5 - Security Hardening & Compliance Review
**Architecture:** Environment variables, Supabase Vault for sensitive API keys
**Goal:** Establish secure secrets management with rotation procedures
**NFR Coverage:** NFR4 (Security), NFR3 (Reliability)

## Acceptance Criteria

1. **Given** environment variables
   **When** reviewing
   **Then** no secrets should be hardcoded in source code or `template.env`

2. **Given** production deployment
   **When** rotating `ENCRYPTION_KEY`
   **Then** dual-key decryption should support old + new keys during transition

3. **Given** external API keys (CCXT, payment providers)
   **When** rotating
   **Then** services should detect rotation and reload without restart

## Tasks / Subtasks

- [ ] **Task 1: Audit Current Secrets**
  - [ ] List all secrets in use:
    - `SUPABASE_URL` - Public, low risk
    - `SUPABASE_SERVICE_ROLE_KEY` - High risk, rotate quarterly
    - `UPSTASH_REDIS_REST_URL` - Public
    - `UPSTASH_REDIS_REST_TOKEN` - Medium risk, rotate quarterly
    - `ENCRYPTION_KEY` - High risk, rotate biannually
    - Exchange API keys (stored encrypted in DB)
    - Payment provider webhooks secrets
  - [ ] Document risk level and rotation frequency

- [ ] **Task 2: Verify Template Files**
  - [ ] Audit `services/api/template.env`:
    ```dotenv
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
    UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
    UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN_HERE
    # (32-byte base64) e.g., use `openssl rand -base64 32` to generate
    ENCRYPTION_KEY=GENERATE_WITH_OPENSSL
    ```
  - [ ] Verify no actual secrets committed
  - [ ] Add `.env*` to `.gitignore` (already done)

- [ ] **Task 3: Implement Dual-Key Decryption**
  - [ ] Update `services/api/src/connections/crypto.utils.ts`:

    ```typescript
    export function decrypt(ciphertext: string): string {
      const currentKey = process.env.ENCRYPTION_KEY;
      const oldKey = process.env.ENCRYPTION_KEY_OLD; // Optional

      try {
        return decryptWithKey(ciphertext, currentKey);
      } catch (err) {
        if (oldKey) {
          console.warn("Decryption with current key failed, trying old key");
          return decryptWithKey(ciphertext, oldKey);
        }
        throw err;
      }
    }
    ```

  - [ ] Test with rotated keys

- [ ] **Task 4: Migrate Exchange Keys to Supabase Vault**
  - [ ] Research Supabase Vault (pgsodium replacement):

    ```sql
    -- Enable Vault extension
    CREATE EXTENSION IF NOT EXISTS vault;

    -- Store secret
    SELECT vault.create_secret('binance_api_key_user_123', 'actual_key_value');

    -- Retrieve secret
    SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'binance_api_key_user_123';
    ```

  - [ ] Migrate existing encrypted keys to Vault
  - [ ] Update `ConnectionsService` to fetch from Vault

- [ ] **Task 5: Hot-Reload API Keys**
  - [ ] Implement key refresh mechanism:

    ```typescript
    @Injectable()
    export class ExchangeService {
      private apiKeys = new Map<string, string>();

      @Cron(CronExpression.EVERY_5_MINUTES)
      async refreshKeys() {
        const keys = await this.fetchKeysFromVault();
        this.apiKeys = new Map(keys);
      }
    }
    ```

  - [ ] Test key rotation without service restart

- [ ] **Task 6: Create Rotation Runbook**
  - [ ] Create `SECRETS_ROTATION.md`:

    ```markdown
    # Secrets Rotation Runbook

    ## ENCRYPTION_KEY (Biannual - Jan 1, Jul 1)

    1. Generate new key: `openssl rand -base64 32`
    2. Set `ENCRYPTION_KEY_OLD=<current_key>`
    3. Set `ENCRYPTION_KEY=<new_key>`
    4. Deploy API (dual-key support active)
    5. Wait 7 days (allow all sessions to refresh)
    6. Remove `ENCRYPTION_KEY_OLD`
    7. Re-encrypt all stored secrets with new key

    ## SUPABASE_SERVICE_ROLE_KEY (Quarterly)

    1. Generate new key in Supabase dashboard
    2. Update key in production environment
    3. Deploy API
    4. Revoke old key in Supabase (after 24h grace period)

    ## Exchange API Keys (On Demand)

    - User-initiated via Settings > Connections
    - Old key invalidated immediately on exchange platform
    ```

  - [ ] Add to team calendar: rotation reminders

- [ ] **Task 7: Environment Variable Documentation**
  - [ ] Update `README.md` with secrets setup:
    - How to generate `ENCRYPTION_KEY`
    - Where to find Supabase credentials
    - How to configure Upstash Redis
  - [ ] Add troubleshooting section for common secret errors

- [ ] **Task 8: Implement Secrets Validation**
  - [ ] Create startup validation in `main.ts`:

    ```typescript
    function validateSecrets() {
      const required = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ENCRYPTION_KEY",
      ];

      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing required secrets: ${missing.join(", ")}`);
      }

      // Validate ENCRYPTION_KEY format (base64, 32 bytes)
      const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
      if (keyBuffer.length !== 32) {
        throw new Error("ENCRYPTION_KEY must be 32 bytes (base64 encoded)");
      }
    }

    validateSecrets();
    ```

  - [ ] Test with invalid secrets

- [ ] **Task 9: (Production) Secrets Manager Integration**
  - [ ] Document AWS Secrets Manager or HashiCorp Vault setup:
    - Store production secrets in external vault
    - Auto-inject into container environment
    - Enable automatic rotation via provider
  - [ ] (Future) Implement provider SDK integration

## Technical Guidelines

- **12-Factor App:** Secrets via environment variables, never in code
- **Rotation Window:** Overlap period for zero-downtime rotation
- **Audit Trail:** Log all secret access (without logging the secret itself)

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `SECRETS_ROTATION.md` - Rotation runbook
- `services/api/src/common/utils/secrets-validator.ts`

**Files to Modify:**

- `services/api/src/connections/crypto.utils.ts` - dual-key support
- `services/api/src/main.ts` - startup validation
- `README.md` - document secrets setup

## References

- [12-Factor App: Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
