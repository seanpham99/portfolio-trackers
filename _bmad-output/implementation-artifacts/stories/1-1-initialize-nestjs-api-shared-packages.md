# Story 1.1: Initialize NestJS API & Shared Packages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want a standardized NestJS API and shared package structure,
so that I can build the backend services with type-safety and consistency across the monorepo.

## Acceptance Criteria

1. **Given** the current Turborepo structure
2. **When** I initialize the NestJS API using `nest new api --package-manager pnpm` in the `services/` directory
3. **Then** the project should be created with strict TypeScript mode enabled
4. **And** the `packages/database-types` (Supabase auto-gen) and `packages/api-types` (DTOs/Shared) packages should be present and linked in `pnpm-workspace.yaml`
5. **And** a basic health check endpoint `GET /` should return a 200 OK status.

## Tasks / Subtasks

- [x] **Task 1: Initialize NestJS Project (AC: 1, 2, 3)**
  - [x] Create `services/api` directory if needed.
  - [x] Run `npx @nestjs/cli new api --package-manager pnpm --skip-git`.
  - [x] Ensure `tsconfig.json` has `strict: true`.
  - [x] Update `package.json` name to `@workspace/api`.
- [x] **Task 2: Setup Shared Type Packages (AC: 4)**
  - [x] Create `packages/database-types` directory.
  - [x] Initialize `packages/database-types/package.json` as `@workspace/database-types`.
  - [x] Create `packages/api-types` directory.
  - [x] Initialize `packages/api-types/package.json` as `@workspace/api-types`.
  - [x] Add `packages/database-types` as a dependency to `@workspace/api-types`.
- [x] **Task 3: Implement Core Health Check (AC: 5)**
  - [x] Verify `app.controller.ts` has a root `GET` endpoint.
  - [x] Ensure it returns a simple 200 OK or `{ "status": "ok" }`.
- [x] **Task 4: Monorepo Integration**
  - [x] Link new packages in the root `pnpm-workspace.yaml`.
  - [x] Add `@workspace/api-types` as a devDependency to `apps/web` and `services/api`.

## Dev Notes

- **Architecture Patterns:** Uses the service-based organization defined in `architecture.md`.
- **Naming Conventions:** Service uses `@workspace/api`, packages use `@workspace/*`.
- **Database Types:** `packages/database-types` is intended to hold the output of `supabase gen types typescript --local`.

### Project Structure Notes

- **Location:** `services/api/` and `packages/*`.
- **Consistency:** Follows the Turborepo pattern already established in the workspace.

### References

- [Source: _bmad-output/architecture.md#Shared Packages]
- [Source: _bmad-output/architecture.md#NestJS (services/api)]
- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro

### Debug Log References

### Completion Notes List

- NestJS API initialized with `@nestjs/cli` v11.0.14
- Strict mode enabled in `tsconfig.json`
- Health check returns `{ status: 'ok' }` at `GET /`
- Unit and e2e tests updated to match new response format
- `services/*` added to `pnpm-workspace.yaml` for proper monorepo integration

### File List

- `services/api/` - NestJS API service
- `services/api/package.json` - Package config with `@workspace/api` name
- `services/api/tsconfig.json` - TypeScript config with `strict: true`
- `services/api/src/app.controller.ts` - Health check endpoint
- `services/api/src/app.service.ts` - Health check service
- `services/api/src/app.controller.spec.ts` - Unit tests (updated)
- `services/api/test/app.e2e-spec.ts` - E2E tests (updated)
- `packages/database-types/package.json` - `@workspace/database-types` package
- `packages/database-types/src/index.ts` - Type exports
- `packages/api-types/package.json` - `@workspace/api-types` package
- `packages/api-types/src/index.ts` - Type exports
- `pnpm-workspace.yaml` - Added `services/*` entry
- `apps/web/package.json` - Added `@workspace/api-types` devDependency
