# Story 2.1: Portfolio Management Logic (API & Database)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to create and manage multiple portfolios across different asset classes,
So that I can organize my investments according to my strategy.

## Acceptance Criteria

1. **Given** the NestJS API and Supabase setup
2. **When** I create, read, update, or delete a portfolio via the API
3. **Then** the changes should be reflected in the Supabase PostgreSQL database
4. **And** Row Level Security (RLS) must ensure I can only access my own portfolios
5. **And** the API should support setting a base currency (VND/USD/USDT) for each portfolio.

## Tasks / Subtasks

- [x] **Task 1: Database Schema & RLS**
  - [x] Create `portfolios` table in Supabase with fields: `id`, `user_id`, `name`, `base_currency` (text check constraint: 'VND', 'USD', 'USDT'), `created_at`.
  - [x] Enable RLS on `portfolios` table.
  - [x] Create RLS policies for SELECT, INSERT, UPDATE, DELETE enforcing `auth.uid() = user_id`.

- [x] **Task 2: NestJS Service & Controller**
  - [x] Generate `PortfoliosModule` in NestJS API.
  - [x] Implement `PortfoliosService` with methods: `create`, `findAll`, `findOne`, `update`, `remove`.
  - [x] Implement `PortfoliosController` with endpoints.

- [x] **Task 3: Validation & Types**
  - [x] Create DTOs: `CreatePortfolioDto`, `UpdatePortfolioDto`.
  - [x] Enforce currency validation (VND, USD, USDT).

## Dev Notes

- **Architecture Patterns:** Use the standard Controller-Service-Repository pattern.
- **Database:** Ensure proper foreign key relationships with `auth.users`.

### Project Structure Notes

- **Location:** `services/api/src/portfolios/`

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.1]

## Dev Agent Record

### Implementation Plan

1. Created Supabase migration for `portfolios` table with RLS policies
2. Implemented NestJS module structure: `PortfoliosModule`, `PortfoliosService`, `PortfoliosController`
3. Created DTOs with class-validator for input validation
4. Implemented AuthGuard and UserId decorator for authentication
5. Created SupabaseModule for dependency injection
6. Added comprehensive unit tests for service and controller

### Debug Log

- Fixed `PartialType` import to use `@nestjs/mapped-types` instead of `@nestjs/common`
- Added definite assignment assertions (`!`) to DTO properties to fix TS2564
- Used `export type` for interface/type exports to fix TS1205 with isolatedModules

### Code Review Fixes (Automated)

- **Shared Configs**: Refactored `tsconfig.json` and `eslint.config.mjs` to extend `@workspace/typescript-config` and `@workspace/eslint-config`.
- **Type Safety**: Refactored `SupabaseModule` and `PortfoliosService` to use `SupabaseClient<Database>` from `@workspace/database-types` for complete type safety.
- **Entity Definition**: Replaced manual `Portfolio` interface with `Database['public']['Tables']['portfolios']['Row']`.
- **Build**: Rebuilt `@workspace/database-types` to ensure `portfolios` table matches schema.

### Completion Notes

- All CRUD operations implemented: create, findAll, findOne, update, remove
- RLS policies enforce user isolation at database level
- Currency validation at both database (CHECK constraint) and API (DTO validation) levels
- 20 unit tests passing covering all service and controller methods
- Build passes with stricter type safety usage matches monorepo standards

## File List

### New Files

- `supabase/migrations/20251227180000_create_portfolios_table.sql`
- `services/api/src/portfolios/portfolios.module.ts`
- `services/api/src/portfolios/portfolios.service.ts`
- `services/api/src/portfolios/portfolios.controller.ts`
- `services/api/src/portfolios/portfolios.service.spec.ts`
- `services/api/src/portfolios/portfolios.controller.spec.ts`
- `services/api/src/portfolios/portfolio.entity.ts`
- `services/api/src/portfolios/index.ts`
- `services/api/src/portfolios/dto/create-portfolio.dto.ts`
- `services/api/src/portfolios/dto/update-portfolio.dto.ts`
- `services/api/src/portfolios/dto/index.ts`
- `services/api/src/portfolios/guards/auth.guard.ts`
- `services/api/src/portfolios/guards/index.ts`
- `services/api/src/portfolios/decorators/user-id.decorator.ts`
- `services/api/src/portfolios/decorators/index.ts`
- `services/api/src/supabase/supabase.module.ts`
- `services/api/src/supabase/index.ts`

### Modified Files

- `services/api/src/app.module.ts`
- `services/api/src/main.ts`
- `services/api/package.json`
- `services/api/tsconfig.json`
- `services/api/eslint.config.mjs`

## Change Log

| Date       | Change Description                                              |
| ---------- | --------------------------------------------------------------- |
| 2025-12-27 | Initial implementation of portfolio management API and database |
| 2025-12-27 | Code review fixes: Shared configs and Database type safety      |
| 2025-12-27 | Upgrade shared ESLint config to v9 and flat config structure    |
