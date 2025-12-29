---
project_name: "fin-sight"
user_name: "Son"
date: "2025-12-29"
sections_completed:
  ["discovery", "typescript", "react", "testing", "code-quality", "workflow"]
workflow_status: "complete"
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend (React 19 + Vite + React Router 7)

- **React**: 19.2.3 (latest features including Actions, useOptimistic)
- **React Router**: 7.11.0 (file-based routing with `@react-router/fs-routes`)
- **Vite**: 7.3.0 (build tool with HMR)
- **TypeScript**: 5.9.3 (strict mode enabled)
- **TanStack React Query**: 5.90.12 (server state management)
- **Framer Motion**: 12.23.26 (animations per UX spec)
- **Radix UI**: Latest (accessible component primitives)
- **Tailwind CSS**: 4.1.18 (utility-first styling)
- **Zustand**: Latest (UI state management only)

### Backend & Data

- **Supabase**: 2.89.0 (Auth + Postgres database)
- **ClickHouse**: Existing production system (market data analytics)
- **Redis**: Planned (30s TTL caching layer)

### Monorepo & Tooling

- **Turborepo**: 2.7.2 (build orchestration)
- **pnpm**: 10.26.2 (package manager)
- **Node.js**: >=20.0.0 (engine requirement)
- **Vitest**: Latest (testing framework)

---

## Critical Implementation Rules

### TypeScript Configuration & Patterns

**ALWAYS:**

- Use TypeScript strict mode (configured in tsconfig)
- Import with `@/*` path aliases for src files: `import { X } from '@/api/hooks/use-portfolios'`
- Import workspace packages with `@repo/*`: `import { Button } from '@repo/ui'`
- Use `import type` for type-only imports to optimize bundles
- Run `react-router typegen` before type-checking to generate route types
- Place shared types in `@repo/database-types` or `@repo/api-types` packages
- Co-locate feature-specific types next to implementation files
- Use named exports (`export const`, `export function`) rather than default exports

**NEVER:**

- Use implicit `any` types (strict mode prevents this)
- Duplicate types that exist in shared packages
- Import from relative paths when `@/*` or `@repo/*` aliases are available
- Mix default and named exports in the same file

### React 19 + React Router 7 Patterns

**ALWAYS:**

- Use React Query for ALL server state management (portfolios, transactions, settings, etc.)
- Use Zustand ONLY for UI state (theme, sidebar, modals) - NEVER for server data
- Follow file-based routing conventions: `_prefix` for layouts, `$param` for dynamic routes, `.` for nesting
- Name route files with underscores for layouts: `_protected._layout.dashboard.tsx`
- Create custom React Query hooks in `api/hooks/` named as `use-[feature].ts`
- Export multiple related hooks from the same file (e.g., `usePortfolios`, `usePortfolio`, `useCreatePortfolio`)
- Invalidate React Query cache after mutations: `queryClient.invalidateQueries(['portfolios'])`
- Use React 19 Actions and useOptimistic for form handling
- Use Framer Motion (v12.23.26) for micro-interactions per UX spec
- Co-locate hooks, components, and tests by feature domain

**NEVER:**

- Store server data in Zustand (use React Query instead)
- Prop drill server state (fetch at consumption point with React Query hooks)
- Create routes with regular files (must follow underscore/$ conventions)
- Mix client and server rendering patterns (app is SPA with Vite)
- Use useEffect for data fetching (use React Query hooks)

### Testing Patterns (Vitest + React Testing Library)

**ALWAYS:**

- Co-locate test files next to implementation: `use-portfolios.test.tsx` next to `use-portfolios.ts`
- Use Vitest globals: `describe`, `it`, `expect`, `vi` (no imports needed)
- Wrap React Query hooks in `QueryClientProvider` with test client for testing
- Mock API calls with `vi.mock('@/lib/api')` to isolate unit tests
- Use `beforeEach` and `afterEach` for test setup/cleanup
- Test critical hooks and complex logic first (React Query hooks, utilities)
- Follow MVP testing strategy: E2E critical paths (Playwright), unit tests for complex logic

**NEVER:**

- Skip tests for new React Query hooks (they're critical for data flow)
- Test implementation details (test behavior, not internal state)
- Forget to clean up mocks between tests (use `vi.restoreAllMocks()`)
- Aim for 100% coverage in MVP phase (quality over coverage per architecture)

### Code Quality & API Patterns

**NestJS Backend (services/api):**

- Organize by feature modules (connections, portfolios, transactions)
- Use DTOs with class-validator decorators for validation
- Inject dependencies via constructor: `constructor(private readonly service: Service) {}`
- Keep controllers thin (routing), services thick (business logic)
- Enable decorators in tsconfig: `experimentalDecorators: true`, `emitDecoratorMetadata: true`

**API Client:**

- Use `apiFetch` wrapper from `@/lib/api` for all API calls
- Define response types in `@repo/api-types` package
- Return typed responses: `apiFetch<Portfolio[]>('/api/portfolios')`

**Code Style:**

- Files: kebab-case (`use-portfolios.ts`, `portfolio-card.tsx`)
- Functions/variables: camelCase (`createPortfolio`, `portfolioData`)
- Classes/types: PascalCase (`Portfolio`, `CreatePortfolioDto`)
- Organize by feature domain (group related code together)
- Follow ESLint config (@repo/eslint-config/react for frontend)

**NEVER:**

- Mix naming conventions within same codebase layer
- Disable ESLint rules without team discussion
- Use `any` type (use `unknown` with type guards)
- Create generic utility files (organize by feature)

### Development Workflow & Critical Anti-Patterns

**Monorepo Workflow:**

- Run `pnpm install` from workspace root (not inside packages)
- Use `pnpm --filter <package>` for package-specific commands
- Type-check before committing: `pnpm run type-check` from root
- Generate route types: `pnpm --filter web run typegen` before type-checking
- Use `workspace:*` protocol for internal dependencies

**Git Conventions:**

- Write descriptive commits: `feat(portfolios): add holdings table with sortable columns`
- Keep commits atomic (one logical change)
- Test locally before pushing (type-check + tests pass)

**Critical Anti-Patterns (NEVER):**

- Store API keys/secrets in code (use `.env`, never commit)
- Fetch server data in useEffect (use React Query hooks)
- Store server data in Zustand (React Query is source of truth)
- Import from `src/` when `@/*` alias exists
- Mix default and named exports
- Prop drill more than 2 levels (use React Query or context)
- Use `index.ts` barrel files (slows HMR and tree-shaking)

**Performance Guidelines:**

- Use React Query's `staleTime` for stable data
- Memoize expensive calculations with `useMemo`
- Use `React.memo()` for frequently rendered components with same props
- Lazy load routes with React Router lazy imports
- Measure before optimizing (React DevTools Profiler)
- Don't over-memoize (has overhead)

---

## Usage Instructions for AI Agents

**When implementing features:**

1. Read this file FIRST before writing code
2. Follow ALWAYS rules strictly - they prevent common mistakes
3. Avoid NEVER patterns - they're based on project-specific decisions
4. Reference architecture.md for broader architectural context
5. When in doubt, ask the user rather than assuming

**This file captures:**

- Unobvious patterns that aren't in typical documentation
- Project-specific decisions (React Query vs Zustand split)
- Version-specific features (React 19, React Router 7)
- Team conventions (naming, organization, workflow)

**This file does NOT replace:**

- Official documentation for libraries/frameworks
- The architecture.md document (read both together)
- Code review and team communication
