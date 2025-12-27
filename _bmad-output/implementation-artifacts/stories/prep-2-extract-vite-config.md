# Story Prep-2: Extract Shared Vite Config

Status: ready-for-dev

## Story

As a Developer,
I want a shared Vite configuration package,
so that I can reuse standard build settings across web and future mobile/other apps without duplication.

## Acceptance Criteria

1.  **Given** the monorepo structure
2.  **When** I create a new package `@repo/vite-config` (or similar)
3.  **Then** it should export a standard Vite configuration/plugin
4.  **And** `apps/web` should import and use this shared config
5.  **And** the web app should still build and run correctly (`pnpm dev`, `pnpm build`)
6.  **And** the configuration should support React 19 and common plugins (tsconfig paths, etc.).

## Tasks

- [ ] **Task 1: Create Config Package**
    - [ ] Initialize `packages/vite-config`.
    - [ ] Create `index.ts` exporting a `baseViteConfig` or function.
    - [ ] Add necessary dependencies (`vite`, `vite-tsconfig-paths`, etc.) to this package.
- [ ] **Task 2: Update Apps/Web**
    - [ ] Add `@repo/vite-config` dependency to `apps/web`.
    - [ ] Update `apps/web/vite.config.ts` to extend the shared config.
    - [ ] Verify dev server and build still work.
