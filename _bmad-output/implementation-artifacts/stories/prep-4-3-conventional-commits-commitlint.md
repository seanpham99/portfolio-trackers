# Story Prep-4.3: Conventional Commits & Commit Linting

Status: backlog

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

- [ ] **Task 1: Install Commitlint**
  - [ ] Run `pnpm add -Dw @commitlint/cli @commitlint/config-conventional`
  - [ ] Verify installations in root `package.json`

- [ ] **Task 2: Configure Commitlint**
  - [ ] Create `commitlint.config.js` in project root:
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
  - [ ] Verify configuration is valid

- [ ] **Task 3: Create Commit-Msg Hook**
  - [ ] Run `echo "pnpm commitlint --edit \$1" > .husky/commit-msg`
  - [ ] Make hook executable: `chmod +x .husky/commit-msg`
  - [ ] Test hook triggers on commit

- [ ] **Task 4: Test Valid Commits**
  - [ ] Test `feat: add new feature`
  - [ ] Test `fix(api): resolve null pointer`
  - [ ] Test `docs: update README`
  - [ ] Verify all pass validation

- [ ] **Task 5: Test Invalid Commits**
  - [ ] Test `updated files` (no type)
  - [ ] Test `Feature: new feature` (wrong case)
  - [ ] Test `feat:missing space`
  - [ ] Verify all are rejected with clear errors

- [ ] **Task 6: (Optional) Install Commitizen**
  - [ ] Run `pnpm add -Dw commitizen cz-conventional-changelog`
  - [ ] Add to root `package.json`:
    ```json
    "config": {
      "commitizen": {
        "path": "cz-conventional-changelog"
      }
    }
    ```
  - [ ] Add script: `"commit": "cz"`
  - [ ] Test interactive commit: `pnpm commit`

- [ ] **Task 7: Document Commit Conventions**
  - [ ] Update `CONTRIBUTING.md` with:
    - Commit message format: `<type>(<scope>): <subject>`
    - List of allowed types and when to use them
    - Examples of good vs bad commit messages
    - How to use `pnpm commit` for guided commits
  - [ ] Add commit message template (`.gitmessage`)

- [ ] **Task 8: Validate with Changesets**
  - [ ] Verify commit types map to changeset bump types:
    - `feat:` → `minor` bump
    - `fix:` → `patch` bump
    - `BREAKING CHANGE:` → `major` bump
  - [ ] Update `CONTRIBUTING.md` with mapping

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

## References

- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitizen](https://github.com/commitizen/cz-cli)
