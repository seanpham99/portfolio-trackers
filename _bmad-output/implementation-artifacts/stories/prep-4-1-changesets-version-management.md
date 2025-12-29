# Story Prep-4.1: Changesets for Version Management

Status: backlog

## Story

As a Developer,
I want automated versioning and changelog generation via Changesets,
So that I can track changes across packages and publish releases with confidence.

## Context

**Sprint Context:** Prep Sprint 4 - Repository Quality & Automation
**Architecture:** Turborepo monorepo with multiple packages (api, web, ui, database-types, api-types)
**Goal:** Enable atomic version bumps and clear changelog generation for all workspace packages

## Acceptance Criteria

1. **Given** the monorepo structure
   **When** I run `pnpm changeset add`
   **Then** I should be prompted to select affected packages and describe changes

2. **Given** multiple changesets in `.changeset/`
   **When** I run `pnpm changeset version`
   **Then** package versions should be bumped atomically and CHANGELOG.md files updated

3. **Given** a changeset workflow
   **When** changes are committed
   **Then** a GitHub Action (or equivalent) should validate changeset presence for non-chore commits

## Tasks / Subtasks

- [ ] **Task 1: Install & Initialize Changesets**
  - [ ] Run `pnpm add -Dw @changesets/cli`
  - [ ] Run `pnpm changeset init`
  - [ ] Verify `.changeset/` folder created with `config.json` and `README.md`

- [ ] **Task 2: Configure Changeset Settings**
  - [ ] Edit `.changeset/config.json`:
    - Set `baseBranch: "main"`
    - Set `access: "restricted"` (private packages)
    - Configure `ignore: []` if any packages should be excluded
  - [ ] Verify all workspace packages are detected

- [ ] **Task 3: Add Package.json Scripts**
  - [ ] Add to root `package.json`:
    - `"changeset": "changeset"`
    - `"changeset:version": "changeset version"`
    - `"changeset:publish": "changeset publish"`
  - [ ] Test `pnpm changeset add` command

- [ ] **Task 4: Create Sample Changeset**
  - [ ] Run `pnpm changeset add` for test change
  - [ ] Select `@repo/api-types` package
  - [ ] Choose `patch` bump
  - [ ] Verify `.changeset/[random-name].md` created

- [ ] **Task 5: Test Version Bumping**
  - [ ] Run `pnpm changeset:version`
  - [ ] Verify package.json versions updated
  - [ ] Verify CHANGELOG.md created/updated
  - [ ] Commit changes with `chore: test changeset workflow`

- [ ] **Task 6: Document Workflow**
  - [ ] Create/update `CONTRIBUTING.md` with:
    - When to create changesets (feature, fix, breaking change)
    - How to run changeset commands
    - Conventional commit types mapping to bump types
  - [ ] Add examples of good changeset descriptions

- [ ] **Task 7: (Optional) CI Integration**
  - [ ] Create `.github/workflows/changeset-check.yml`
  - [ ] Add step to validate changeset presence on PRs
  - [ ] Exclude `chore:`, `docs:`, `test:` commits from check

## Technical Guidelines

- **Changeset Types:** `major` (breaking), `minor` (feature), `patch` (fix)
- **Description Format:** User-facing, present tense (e.g., "Add crypto connection API")
- **Multi-Package Changes:** One changeset can affect multiple packages

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `.changeset/config.json`
- `.changeset/README.md`
- `CONTRIBUTING.md` (or update if exists)
- (Optional) `.github/workflows/changeset-check.yml`

**Files to Modify:**

- `package.json` (root) - add scripts

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Turborepo + Changesets Guide](https://turbo.build/repo/docs/handbook/publishing-packages/versioning-and-publishing)
