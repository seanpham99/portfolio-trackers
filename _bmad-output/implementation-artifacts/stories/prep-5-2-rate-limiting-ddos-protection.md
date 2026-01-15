# Story Prep-5.2: Rate Limiting & DDoS Protection

Status: backlog

## Story

As a System Administrator,
I want API rate limiting per user/IP,
So that the platform remains available during traffic spikes or attacks.

## Context

**Sprint Context:** Prep Sprint 5 - Security Hardening & Compliance Review
**Architecture:** NestJS API with Upstash Redis (already in stack)
**Goal:** Prevent abuse and ensure fair resource allocation
**NFR Coverage:** NFR3 (Reliability), NFR7 (Scalability)

## Acceptance Criteria

1. **Given** authenticated requests
   **When** a user exceeds 100 requests/minute
   **Then** they should receive 429 Too Many Requests

2. **Given** unauthenticated requests
   **When** an IP exceeds 20 requests/minute
   **Then** they should be rate-limited

3. **Given** rate-limit exceeded
   **When** response is sent
   **Then** it should include `Retry-After` header

## Tasks / Subtasks

- [ ] **Task 1: Install Rate Limiting Package**
  - [ ] Run `pnpm add @nestjs/throttler` in `services/api`
  - [ ] Run `pnpm add @nestjs/throttler-storage-redis`
  - [ ] Verify installations

- [ ] **Task 2: Configure Global Rate Limits**
  - [ ] Edit `services/api/src/app.module.ts`:

    ```typescript
    import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
    import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
    import Redis from 'ioredis';

    @Module({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 1 minute
              limit: 100, // 100 requests per minute
            },
            {
              name: 'strict',
              ttl: 60000,
              limit: 20, // For unauthenticated routes
            },
          ],
          storage: new ThrottlerStorageRedisService(
            new Redis({
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT),
              password: process.env.REDIS_PASSWORD,
            })
          ),
        }),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })
    ```

  - [ ] Verify Redis connection

- [ ] **Task 3: Custom Rate Limit Decorators**
  - [ ] Create `services/api/src/common/decorators/throttle.decorator.ts`:

    ```typescript
    import { SetMetadata } from "@nestjs/common";
    import { Throttle } from "@nestjs/throttler";

    // Strict limits for auth endpoints
    export const StrictThrottle = () =>
      Throttle({ default: { limit: 20, ttl: 60000 } });

    // Relaxed limits for read-only endpoints
    export const RelaxedThrottle = () =>
      Throttle({ default: { limit: 200, ttl: 60000 } });
    ```

  - [ ] Apply to relevant controllers

- [ ] **Task 4: Per-User Rate Limiting**
  - [ ] Create custom guard `services/api/src/common/guards/user-throttle.guard.ts`:
    ```typescript
    @Injectable()
    export class UserThrottleGuard extends ThrottlerGuard {
      protected async getTracker(req: Request): Promise<string> {
        const user = req["user"]; // From JWT
        return user?.id || req.ip; // Use user ID if authenticated, else IP
      }
    }
    ```
  - [ ] Register guard in `app.module.ts`

- [ ] **Task 5: Configure Endpoint-Specific Limits**
  - [ ] Auth endpoints: 5 requests/15 minutes
    ```typescript
    @StrictThrottle()
    @Post('login')
    async login() { ... }
    ```
  - [ ] Price data endpoints: 200 requests/minute
  - [ ] Transaction mutations: 50 requests/minute
  - [ ] Webhook endpoints: 100 requests/minute (per provider)

- [ ] **Task 6: Rate Limit Headers**
  - [ ] Ensure responses include:
    - `X-RateLimit-Limit: 100`
    - `X-RateLimit-Remaining: 45`
    - `X-RateLimit-Reset: 1640000000`
    - `Retry-After: 30` (when exceeded)
  - [ ] Test header presence on all rate-limited routes

- [ ] **Task 7: (Production) Cloudflare DDoS Protection**
  - [ ] Document Cloudflare setup steps in `DEPLOYMENT.md`:
    - Enable "Under Attack Mode" for severe DDoS
    - Configure rate limiting rules at CDN layer
    - Set up firewall rules for known bad IPs
  - [ ] Add Cloudflare WAF rules for common attack patterns
  - [ ] (Manual) Point domain DNS to Cloudflare nameservers

- [ ] **Task 8: Monitoring & Alerts**
  - [ ] Add rate limit metrics to logging:
    - `rate_limit_exceeded` events with user ID/IP
    - Aggregate by endpoint and time period
  - [ ] Set up alert: >50 rate limit violations/minute → notify DevOps
  - [ ] Dashboard: Track rate limit hit rate by endpoint

- [ ] **Task 9: Integration Tests**
  - [ ] Test rate limit enforcement for authenticated users
  - [ ] Test rate limit enforcement for unauthenticated IPs
  - [ ] Test `Retry-After` header correctness
  - [ ] Test rate limit reset after TTL expires

## Technical Guidelines

- **Distributed Rate Limiting:** Use Redis to share state across API instances
- **Graceful Degradation:** If Redis fails, fall back to in-memory (per-instance) limiting
- **Whitelisting:** Consider whitelisting internal services or known good IPs

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `services/api/src/common/decorators/throttle.decorator.ts`
- `services/api/src/common/guards/user-throttle.guard.ts`
- `services/api/test/security/rate-limit.spec.ts`

**Files to Modify:**

- `services/api/src/app.module.ts` - configure ThrottlerModule
- Controllers - apply rate limit decorators
- `DEPLOYMENT.md` - document Cloudflare setup

## References

- [NestJS Throttler](https://docs.nestjs.com/security/rate-limiting)
- [OWASP API Security - Rate Limiting](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [Cloudflare DDoS Protection](https://developers.cloudflare.com/ddos-protection/)
