# Story Prep-5.1: CSRF Protection & Security Headers

Status: backlog

## Story

As a User,
I want protection against CSRF attacks,
So that malicious sites cannot perform actions on my behalf.

## Context

**Sprint Context:** Prep Sprint 5 - Security Hardening & Compliance Review
**Architecture:** NestJS API with Supabase JWT auth, React 19 frontend
**Threat Model:** Cross-site request forgery, clickjacking, content sniffing attacks
**NFR Coverage:** NFR4 (Security)

## Acceptance Criteria

1. **Given** the NestJS API
   **When** a request is made without proper CSRF token
   **Then** it should be rejected with 403 Forbidden

2. **Given** the React frontend
   **When** making mutations (POST/PUT/DELETE)
   **Then** a CSRF token should be included in headers

3. **Given** API responses
   **When** inspecting headers
   **Then** I should see: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`

## Tasks / Subtasks

- [ ] **Task 1: Install Security Packages**
  - [ ] Run `pnpm add helmet` in `services/api`
  - [ ] Run `pnpm add @nestjs/csrf` in `services/api`
  - [ ] Verify installations

- [ ] **Task 2: Configure Helmet Middleware**
  - [ ] Edit `services/api/src/main.ts`:

    ```typescript
    import helmet from "helmet";

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://s3.tradingview.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: [
              "'self'",
              "https://*.supabase.co",
              "https://api.coingecko.com",
              "wss://*.supabase.co",
            ],
            frameSrc: ["'self'", "https://www.tradingview.com"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );
    ```

  - [ ] Test CSP doesn't break Supabase or TradingView

- [ ] **Task 3: Enable CSRF Protection**
  - [ ] Install `@nestjs/csrf`
  - [ ] Configure CSRF guard in `app.module.ts`:

    ```typescript
    import { CsrfModule } from '@nestjs/csrf';

    @Module({
      imports: [
        CsrfModule.register({
          cookieOptions: {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
          },
        }),
      ],
    })
    ```

  - [ ] Add global CSRF guard to protected routes

- [ ] **Task 4: Frontend CSRF Token Handling**
  - [ ] Update `apps/web/src/api/client.ts`:
    - Fetch CSRF token from cookie or header
    - Include token in mutation requests (POST/PUT/DELETE)
  - [ ] Add axios interceptor or custom fetch wrapper
  - [ ] Test token refresh on expiration

- [ ] **Task 5: Exclude Public Endpoints**
  - [ ] Add `@CsrfExempt()` decorator to:
    - `/health` endpoint
    - `/auth/login` (initial authentication)
    - Webhook endpoints (use signature verification instead)
  - [ ] Document exempted endpoints in `SECURITY.md`

- [ ] **Task 6: Security Headers Validation**
  - [ ] Use security scanner (e.g., Mozilla Observatory, securityheaders.com)
  - [ ] Verify headers present:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Strict-Transport-Security: max-age=31536000`
    - `Content-Security-Policy: ...`
  - [ ] Achieve A+ rating on securityheaders.com

- [ ] **Task 7: CORS Configuration Review**
  - [ ] Edit `main.ts` CORS config:
    ```typescript
    app.enableCors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    });
    ```
  - [ ] Verify no wildcard origins in production
  - [ ] Test preflight requests

- [ ] **Task 8: Integration Tests**
  - [ ] Test CSRF token required for mutations
  - [ ] Test CSRF token rejection on tampered requests
  - [ ] Test CSP doesn't block legitimate resources
  - [ ] Document test scenarios in `services/api/test/security/`

## Technical Guidelines

- **CSRF Strategy:** Double-submit cookie pattern
- **CSP Reporting:** Add `report-uri` in production for violation monitoring
- **Helmet Config:** Adjust directives as needed for third-party integrations

## Dev Agent Record

**Date:** 2025-12-29

**Files to Modify:**

- `services/api/src/main.ts` - add Helmet and CORS config
- `services/api/src/app.module.ts` - register CSRF module
- `apps/web/src/api/client.ts` - handle CSRF tokens

**Files to Create:**

- `SECURITY.md` - document security practices
- `services/api/test/security/csrf.spec.ts` - CSRF tests

## References

- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Helmet.js](https://helmetjs.github.io/)
