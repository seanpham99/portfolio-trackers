# Story Prep-4.2: Lint-Staged & Husky for Pre-Commit Quality

Status: backlog

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

- [ ] **Task 1: Install Dependencies**
  - [ ] Run `pnpm add -Dw husky lint-staged`
  - [ ] Verify installations in root `package.json`

- [ ] **Task 2: Initialize Husky**
  - [ ] Add `"prepare": "husky"` to root `package.json` scripts
  - [ ] Run `pnpm prepare` to initialize `.husky/` directory
  - [ ] Verify `.husky/` folder created

- [ ] **Task 3: Create Pre-Commit Hook**
  - [ ] Run `echo "pnpm lint-staged" > .husky/pre-commit`
  - [ ] Make hook executable: `chmod +x .husky/pre-commit`
  - [ ] Test hook triggers on commit attempt

- [ ] **Task 4: Configure Lint-Staged**
  - [ ] Create `.lintstagedrc.json` in project root:
    ```json
    {
      "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
      "*.{json,md,yaml,yml}": ["prettier --write"]
    }
    ```
  - [ ] Verify configuration is valid

- [ ] **Task 5: Test Pre-Commit Workflow**
  - [ ] Modify a `.ts` file with intentional lint error
  - [ ] Stage file: `git add <file>`
  - [ ] Attempt commit: `git commit -m "test"`
  - [ ] Verify commit blocked with error message
  - [ ] Fix error and verify commit succeeds

- [ ] **Task 6: Test Auto-Formatting**
  - [ ] Modify a `.ts` file with formatting issues (remove semicolon, wrong indentation)
  - [ ] Stage and commit
  - [ ] Verify file is auto-formatted before commit completes

- [ ] **Task 7: Document Workflow**
  - [ ] Update `CONTRIBUTING.md` with:
    - Pre-commit hooks behavior
    - How to bypass (--no-verify) and when appropriate
    - Troubleshooting common issues
  - [ ] Add note about running `pnpm prepare` after fresh clone

- [ ] **Task 8: Handle Edge Cases**
  - [ ] Test with large file (ensure performance acceptable)
  - [ ] Test with binary files (ensure ignored)
  - [ ] Add `.lintstagedrc.json` rules to ignore generated files if needed

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
