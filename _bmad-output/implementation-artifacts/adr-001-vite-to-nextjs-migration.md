# ADR-001: Vite to Next.js 16 Migration

**Status:** Accepted  
**Date:** 2025-12-30  
**Decision Makers:** Son (Product Owner), PM, Architect, SM

---

## Context

The fin-sight project currently uses Vite 7.3.0 + React Router 7.11.0 for the frontend application (`apps/web`). This is a Single Page Application (SPA) architecture that provides excellent developer experience and fast client-side navigation.

However, two strategic needs have emerged:

1. **SEO Requirements:** Upcoming marketing launch requires search engine visibility for landing pages and blog content
2. **Team Expertise:** The team has more experience with Next.js than with Vite + React Router 7, reducing the learning curve and increasing velocity

## Decision

**We will migrate from Vite to Next.js 16 using a hybrid approach:**

1. **Create `apps/web`** - New Next.js 16 App Router application for:
   - Landing page (SEO-critical)
   - Blog/marketing content (SEO-critical)
   - Public pages (about, pricing, legal)

2. **Migrate `apps/web-archived`** - Convert existing Vite SPA to Next.js 16 for:
   - Authenticated dashboard and portfolio management
   - Unified codebase and developer experience
   - Server-side auth handling with Supabase SSR

3. **Drop current in-review work** - Stories 3-1 and tech-debt-4 will be reworked after migration

## Rationale

### Why Full Migration (Not Just Marketing App)?

| Factor                | Marketing-Only             | Full Migration           |
| --------------------- | -------------------------- | ------------------------ |
| Team learning curve   | Two frameworks to maintain | Single framework         |
| Code sharing          | Complex cross-app imports  | Native shared components |
| Auth flow             | Redirect-based handoff     | Unified SSR auth         |
| Long-term maintenance | Two build systems          | Single build pipeline    |
| Developer velocity    | Context switching          | Consistent patterns      |

**Decision:** Full migration is preferred despite higher upfront cost because:

- Team already knows Next.js (reduces learning curve)
- Eliminates Vite-specific knowledge debt
- Future features benefit from SSR/SSG capabilities

### Why Next.js 16 App Router?

- React Server Components (RSC) for optimal SEO
- Built-in file-based routing (similar concept to React Router 7)
- Native React 19 support
- Active development and ecosystem

### Why Now?

- Epic 3 is early (only 1 story in review, droppable)
- Epics 4-8 are all backlog (no rework needed)
- Clean slate for remaining ~20 stories
- Marketing launch timeline requires SEO soon

## Consequences

### Positive

- ✅ SEO capability for marketing and blog content
- ✅ Unified tech stack (team familiarity)
- ✅ Server-side rendering for improved performance
- ✅ Supabase SSR auth (more secure cookie-based)
- ✅ Future stories built native to Next.js

### Negative

- ❌ 2-3 sprint delay for migration work
- ❌ Dropped work on 3-1 and tech-debt-4 (will rework)
- ❌ Auth flow rewrite required (client → server)
- ❌ React Query hydration patterns to learn

### Risks & Mitigations

| Risk                   | Likelihood | Impact | Mitigation                               |
| ---------------------- | ---------- | ------ | ---------------------------------------- |
| Auth regression        | Medium     | High   | Comprehensive E2E tests; gradual rollout |
| Extended timeline      | Medium     | Medium | Spike story first; accurate estimation   |
| Performance regression | Low        | Low    | Baseline metrics; compare before/after   |

## Implementation Approach

### Phase 1: Foundation (Sprint 1)

1. Initialize Next.js 16 in `apps/web`
2. Configure Turborepo for dual apps temporarily
3. Spike: Validate Supabase SSR auth flow
4. Migrate core layout and navigation

### Phase 2: Route Migration (Sprint 1-2)

5. Migrate auth routes (login, signup, OAuth)
6. Migrate dashboard and portfolio routes
7. Migrate settings and connections pages
8. Configure React Query with SSR hydration

### Phase 3: Marketing & Cutover (Sprint 2)

9. Create landing page with Next.js
10. Create blog/marketing content structure
11. Switch deployment from Vite to Next.js
12. Remove old Vite app, update CI/CD

## Technical Notes

### Key Configuration Changes

```
Before (Vite):
├── apps/web/vite.config.ts
├── apps/web/react-router.config.ts
└── @react-router/fs-routes

After (Next.js 16):
├── apps/web/next.config.ts
├── apps/web/app/ (App Router)
└── Native file-based routing
```

### Auth Architecture Change

```
Before (Client-side):
Browser → Supabase JS Client → localStorage token → API

After (Server-side):
Browser → Next.js Server → Supabase SSR → httpOnly cookies → API
```

### Shared Packages (No Change)

These packages remain framework-agnostic:

- `@workspace/ui` - React components
- `@workspace/api-types` - TypeScript DTOs
- `@workspace/database-types` - Supabase types

## References

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side)
- [React Query SSR with Next.js](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [fin-sight Architecture Document](../architecture.md)
- [fin-sight Project Context](../project-context.md)
