# Story Prep-1: Fix CI Pipeline for Monorepo

Status: done

## Story

As a Developer,
I want the CI pipeline to run successfully on every PR,
so that I can be confident that my changes don't break the build or tests in the new monorepo structure.

## Acceptance Criteria

1.  **Given** a Pull Request or Push to `main`
2.  **When** the GitHub Actions workflow triggers
3.  **Then** it should successfully build all apps and packages (`turborepo build`)
4.  **And** it should run the test suite for `apps/web` (Vitest)
5.  **And** it should handle the Supabase environment variables appropriately (using secrets or mocks)
6.  **And** the workflow should be green (pass) for the current main branch.

## Tasks

- [x] **Task 1: Update Workflow File**
  - [x] Update `.github/workflows/test.yml` to install `pnpm`, setup node, and run `turbo build test`.
  - [x] Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided (secrets or placeholders for build).
- [x] **Task 2: Fix Test Environment**
  - [x] Verify `apps/web` tests run in CI (mocking `useSearchParams` and standard browser APIs).
  - [x] Fix any "Database Types" dependency issues in CI.
- [x] **Task 3: Fix Data Pipeline CI (AC: 4)**
  - [x] Update `test` job in `.github/workflows/test.yml` to run in `services/data-pipeline`.
  - [x] Ensure python/pytest steps use correct working directory.
  - [x] Separate JS/TS tests (web-test) from Python tests (data-pipeline-test).

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet

### Completion Notes

- Updated `.github/workflows/test.yml` to include a `web-test` job running `pnpm turbo build test`.
- Added global mocks for `react-router`, `framer-motion`, and `react-hook-form` in `apps/web/test/setup.ts` to solve CI/test failures.
- Verified passing tests locally with `pnpm turbo build test` which mimics the CI environment.
- Fixed `act(...)` warning in `privacy-consent-modal.test.tsx`.
- All 13 tests in `apps/web` passed. NestJS API tests also running.
- **Data Pipeline Fix:** Migrated Python CI jobs to `data-pipeline-test` and `data-pipeline-lint`, setting `working-directory: ./services/data-pipeline` to correctly locate tests and requirements in the monorepo structure.

### File List

- .github/workflows/test.yml
- apps/web/test/setup.ts
- apps/web/src/**tests**/auth.login.test.tsx
- apps/web/src/**tests**/auth.sign-up.test.tsx
- apps/web/src/**tests**/privacy-consent-modal.test.tsx
