# Story Prep-4.2: Lint-Staged & Husky for Pre-Commit Quality

Status: done

## Story

As a Developer,
I want automatic linting and formatting before commits,
So that code quality issues are caught before reaching CI.

## Context

**Sprint Context:** Prep Sprint 4 - Repository Quality & Automation
**Dependencies:** Existing ESLint and Prettier configurations in monorepo
**Goal:** Prevent commits with linting errors or formatting issues

## Acceptance Criteria

1. **Given** staged files with linting errors
   **When** I run `git commit`
   **Then** the commit should be blocked and errors displayed

2. **Given** staged TypeScript files
   **When** pre-commit hook runs
   **Then** only staged files should be type-checked (not entire project)

3. **Given** successful pre-commit checks
   **When** I commit
   **Then** changes should be automatically formatted (Prettier)

## Tasks / Subtasks

- [x] **Task 1: Install Dependencies**
  - [x] Run `pnpm add -Dw husky lint-staged`
  - [x] Verify installations in root `package.json`

- [x] **Task 2: Initialize Husky**
  - [x] Add `"prepare": "husky"` to root `package.json` scripts
  - [x] Run `pnpm prepare` to initialize `.husky/` directory
  - [x] Verify `.husky/` folder created

- [x] **Task 3: Create Pre-Commit Hook**
  - [x] Created `.husky/pre-commit` with `pnpm lint-staged`
  - [x] Made hook executable: `chmod +x .husky/pre-commit`
  - [x] Verified hook triggers on commit

- [x] **Task 4: Configure Lint-Staged**
  - [x] Created `.lintstagedrc.json` in project root:
    ```json
    {
      "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
      "*.{json,md,yaml,yml}": ["prettier --write"]
    }
    ```
  - [x] Verified configuration is valid

- [x] **Task 5: Test Pre-Commit Workflow**
  - [x] Ran commit; hook executed lint-staged successfully

- [x] **Task 6: Test Auto-Formatting**
  - [x] Verified Prettier runs on staged JSON/MD files

- [x] **Task 7: Document Workflow**
  - [x] Updated `CONTRIBUTING.md` with pre-commit hooks behavior, bypass, troubleshooting
  - [x] Added note about running `pnpm prepare` after fresh clone

- [x] **Task 8: Handle Edge Cases**
  - [x] Config targets only text files; binaries ignored by default

## Technical Guidelines

- **Performance:** Only staged files are processed (incremental checking)
- **Escape Hatch:** `git commit --no-verify` bypasses hooks (discouraged)
- **Monorepo:** Husky runs at root, lint-staged scans all workspaces

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `.husky/pre-commit`
- `.lintstagedrc.json`

**Files to Modify:**

- `package.json` (root) - add "prepare" script
- `CONTRIBUTING.md` - document pre-commit workflow

## References

- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-Staged Documentation](https://github.com/okonet/lint-staged)
