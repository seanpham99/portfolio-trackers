---
project_name: "portfolios-tracker"
user_name: "Son"
date: "2026-01-15T18:50:00Z"
sections_completed:
  [
    "technology_stack",
    "language_rules",
    "framework_rules",
    "testing_rules",
    "quality_rules",
    "workflow_rules",
    "anti_patterns",
  ]
status: "complete"
rule_count: 28
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Monorepo**: Turborepo 2.7.4 with pnpm 10.26.2
- **Frontend (apps/web)**: Next.js 16.1.2, React 19.2.3, Tailwind CSS 4, Radix UI/Shadcn UI, TanStack Query 5, Recharts.
- **Backend (services/api)**: NestJS 11.1.10, Swagger 11.2.3, Supabase JS 2.89, Upstash Redis 1.36, CCXT 4.5.29.
- **Shared Packages**: `@workspace/shared-types` (DTOs/Schemas), `@workspace/ui` (Primitives).
- **Core Infrastructure**: Supabase (Auth/Postgres), Upstash (Redis), ClickHouse (Analytics).

## Critical Implementation Rules

### Language-Specific Rules

- **ESM-First Imports**: Internal imports **MUST** include the `.js` extension (e.g., `import { x } from "./utils.js"`).
- **Type Safety**: Import all shared DTOs from `@workspace/shared-types/api` and database entities from `@workspace/shared-types/database/supabase-types`. Never redefine shared types.
- **Financial Precision**: **NEVER** use float math for currency. Use string-based decimals or high-precision math libraries.
- **Dual Validation**: Mirror **Zod** (Frontend) validation with **Class-Validator** (Backend) DTO decorators.
- **Standard Envelope**: API responses must follow: `{ success: boolean, data: any, error: any, meta: any }`.

### Framework-Specific Rules

- **Feature-Based UI**: Logic MUST live in `apps/web/src/features/`. Co-locate components, hooks, and tests.
- **Server State**: Use **TanStack Query** as the single source of truth for external data. Avoid syncing to local state.
- **UI Architecture**: Build on `@workspace/ui` primitives. Use **Tailwind CSS 4** with mobile-first responsiveness.
- **NestJS Modules**: Organize by domain (e.g., `src/portfolios/`). Place `dto/`, `guards/`, and `decorators/` in sub-folders.

### Testing Rules

- **Co-location Strategy**: Place `*.test.ts/tsx` or `*.spec.ts` files directly alongside the source code.
- **Frontend Testing**: Use **Vitest** with `@testing-library/react`. Mock at the API client level, not the hook level.
- **Backend Testing**: Use **Jest** and standard NestJS testing modules.
- **E2E Testing**: Use **Playwright** in `tests/e2e/` for critical user journeys and resiliency checks.

### Code Quality & Style Rules

- **Standard Naming**: `kebab-case` for files/folders, `PascalCase` for classes/components, `camelCase` for vars/funcs.
- **Formatting**: Double quotes, `printWidth: 100`, semi-colons required. `_` prefix for unused vars.
- **Documentation**: JSDoc **REQUIRED** for any complex calculation logic in `@workspace/finance` or utilities.
- **Clean Registry**: Use shared configs from `packages/eslint-config`.

### Development Workflow Rules

- **Conventional Commits**: Strictly follow `type: subject` pattern (e.g., `feat: add crypto sync`).
- **Changesets**: Include a changeset (`pnpm changeset`) for any user-facing PRs.
- **CI/CD**: GitHub Actions run tests/linting on every push. Turborepo handles build caching.

### Critical Don't-Miss Rules (Anti-Patterns)

- **Floating Point Math**: Never use for money or net worth aggregation.
- **Redundant State**: Do not store Query-managed data in Zustand or local state.
- **Direct DB Access**: Apps must use shared types from `@workspace/shared-types`; do not define schemas locally.
- **Resiliency**: UI must handle stale data scenarios (staleness > 60s) with "Staleness Banners" or badges.
- **Rate Limits**: Implement exponential backoff for all external API calls (e.g., CCXT/Binance).
- **Global Parity**: Track ANY global stock (not just US/VN). Support for any nation's ticker via Yahoo Finance is a first-class requirement.
- **Security**: filtering via Supabase RLS is mandatory. Never bypass RLS in the client or standard API routes.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new, recurring patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack or core patterns change.
- Review quarterly for outdated rules.
- Remove rules that become native or obvious over time.

_Last Updated: 2026-01-15_
