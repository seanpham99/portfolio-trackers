# Story Prep-4.3: Conventional Commits & Commit Linting

Status: done

## Story

As a Developer,
I want enforced conventional commit messages,
So that changelogs are auto-generated correctly and commit history is readable.

## Context

**Sprint Context:** Prep Sprint 4 - Repository Quality & Automation
**Dependencies:** Story Prep-4.2 (Husky must be configured first)
**Goal:** Enforce semantic commit messages for automated changelog generation

## Acceptance Criteria

1. **Given** a commit message like `feat: add user auth`
   **When** I commit
   **Then** it should pass validation

2. **Given** an invalid message like `updated stuff`
   **When** I commit
   **Then** it should be rejected with helpful error message

3. **Given** conventional commits in history
   **When** generating changelog
   **Then** commits should be grouped by type (feat, fix, chore, etc.)

## Tasks / Subtasks

- [x] **Task 1: Install Commitlint**
  - [x] Run `pnpm add -Dw @commitlint/cli @commitlint/config-conventional`
  - [x] Verify installations in root `package.json`

- [x] **Task 2: Configure Commitlint**
  - [x] Create `commitlint.config.js` in project root:
    ```javascript
    module.exports = {
      extends: ["@commitlint/config-conventional"],
      rules: {
        "type-enum": [
          2,
          "always",
          [
            "feat", // New feature
            "fix", // Bug fix
            "docs", // Documentation only
            "style", // Formatting, missing semicolons, etc.
            "refactor", // Code change that neither fixes a bug nor adds a feature
            "perf", // Performance improvement
            "test", // Adding missing tests
            "chore", // Maintenance (deps, config, etc.)
            "revert", // Revert previous commit
            "wip", // Work in progress (discouraged)
          ],
        ],
        "scope-empty": [1, "never"], // Warn if scope is empty
        "subject-case": [2, "always", "sentence-case"],
      },
    };
    ```
  - [x] Verify configuration is valid

- [x] **Task 3: Create Commit-Msg Hook**
  - [x] Run `echo "pnpm commitlint --edit \$1" > .husky/commit-msg`
  - [x] Make hook executable: `chmod +x .husky/commit-msg`
  - [x] Test hook triggers on commit

- [x] **Task 4: Test Valid Commits**
  - [x] Test `feat: add new feature`
  - [x] Test `fix(api): resolve null pointer`
  - [x] Test `docs: update README`
  - [x] Verify all pass validation

- [x] **Task 5: Test Invalid Commits**
  - [x] Test `updated files` (no type)
  - [x] Test `Feature: new feature` (wrong case)
  - [x] Test `feat:missing space`
  - [x] Verify all are rejected with clear errors

- [x] **Task 6: (Optional) Install Commitizen**
  - [x] Run `pnpm add -Dw commitizen cz-conventional-changelog`
  - [x] Add to root `package.json`:
    ```json
    "config": {
      "commitizen": {
        "path": "cz-conventional-changelog"
      }
    }
    ```
  - [x] Add script: `"commit": "cz"`
  - [x] Test interactive commit: `pnpm commit`

- [x] **Task 7: Document Commit Conventions**
  - [x] Update `CONTRIBUTING.md` with:
    - Commit message format: `<type>(<scope>): <subject>`
    - List of allowed types and when to use them
    - Examples of good vs bad commit messages
    - How to use `pnpm commit` for guided commits
  - [x] Add commit message template (`.gitmessage`)

- [x] **Task 8: Validate with Changesets**
  - [x] Verify commit types map to changeset bump types:
    - `feat:` → `minor` bump
    - `fix:` → `patch` bump
    - `BREAKING CHANGE:` → `major` bump
  - [x] Update `CONTRIBUTING.md` with mapping

## Technical Guidelines

- **Format:** `<type>(<scope>): <subject>` (scope optional)
- **Subject:** Imperative mood ("add" not "added"), lowercase, no period
- **Breaking Changes:** Include `BREAKING CHANGE:` in commit body or use `!` (e.g., `feat!: breaking change`)

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `commitlint.config.js`
- `.husky/commit-msg`
- (Optional) `.gitmessage` - commit template

**Files to Modify:**

- `CONTRIBUTING.md` - document conventions
- (Optional) `package.json` - add commitizen config

### Implementation Notes

- Installed Commitlint: `@commitlint/cli`, `@commitlint/config-conventional` [Task 1]
- Configured commitlint with allowed types; disabled `subject-case` to permit acronyms (e.g., README) consistent with ACs [Task 2]
- Added Husky `commit-msg` hook invoking `pnpm commitlint --edit "$1"`; removed deprecated wrapper lines per Husky v10 guidance [Task 3]
- Validated commits:
  - Passed: `feat: add new feature` (warned scope-empty), `fix(api): resolve null pointer`, `docs: update README` [Task 4]
- Rejected invalid commits: `updated files`, `Feature: new feature`, `feat:missing space` [Task 5]
- Installed Commitizen + adapter; added `commit` script and config in root `package.json` [Task 6]
- Updated `CONTRIBUTING.md` with commit rules, interactive commit usage, template, and mapping to Changesets [Task 7, Task 8]

### File List (updated)

- `commitlint.config.js` (new)
- `.husky/commit-msg` (new)
- `.gitmessage` (new)
- `CONTRIBUTING.md` (modified)
- `package.json` (modified)
- `pnpm-lock.yaml` (modified)

### Status

All tasks completed. Commitlint enforced; Commitizen configured; Documentation updated.

## References

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitizen](https://github.com/commitizen/cz-cli)
