# Story Prep-2: Extract Shared Vite Config

Status: done

## Story

As a Developer,
I want a shared Vite configuration package,
so that I can reuse standard build settings across web and future mobile/other apps without duplication.

## Acceptance Criteria

1.  **Given** the monorepo structure
2.  **When** I create a new package `@workspace/vite-config` (or similar)
3.  **Then** it should export a standard Vite configuration/plugin
4.  **And** `apps/web` should import and use this shared config
5.  **And** the web app should still build and run correctly (`pnpm dev`, `pnpm build`)
6.  **And** the configuration should support React 19 and common plugins (tsconfig paths, etc.).

## Tasks

- [x] **Task 1: Create Config Package**
  - [x] Initialize `packages/vite-config`.
  - [x] Create `index.ts` exporting a `baseViteConfig` or function.
  - [x] Add necessary dependencies (`vite`, `vite-tsconfig-paths`, etc.) to this package.
- [x] **Task 2: Update Apps/Web**
  - [x] Add `@workspace/vite-config` dependency to `apps/web`.
  - [x] Update `apps/web/vite.config.ts` to extend the shared config.
  - [x] Verify dev server and build still work.

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Thinking)

### Completion Notes

- Created `@workspace/vite-config` package with TypeScript build setup
- Configured package to build from `src/` to `dist/` with proper type declarations
- Overcame `noEmit: true` issue in base tsconfig by explicitly setting `noEmit: false`
- Shared config exports `getBaseViteConfig()` function with Tailwind CSS and tsconfig paths plugins
- Updated `apps/web/vite.config.ts` to use `mergeConfig` for composition
- Verified both `pnpm build` and `pnpm turbo build test` work correctly
- All tests passing (13 tests in web, Jest tests in API)

### File List

- packages/vite-config/package.json
- packages/vite-config/tsconfig.json
- packages/vite-config/src/index.ts
- apps/web/vite.config.ts
- apps/web/package.json (updated dependencies)
