# Story Prep-4.1: Changesets for Version Management

Status: done

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

- [x] **Task 1: Install & Initialize Changesets**
  - [x] Run `pnpm add -Dw @changesets/cli`
  - [x] Run `pnpm changeset init`
  - [x] Verify `.changeset/` folder created with `config.json` and `README.md`

- [x] **Task 2: Configure Changeset Settings**
  - [x] Edit `.changeset/config.json`:
    - Set `baseBranch: "master"` (repo uses master, not main)
    - Set `access: "restricted"` (private packages)
    - Configure `ignore: []` if any packages should be excluded
  - [x] Verify all workspace packages are detected

- [x] **Task 3: Add Package.json Scripts**
  - [x] Add to root `package.json`:
    - `"changeset": "changeset"`
    - `"changeset:version": "changeset version"`
    - `"changeset:publish": "changeset publish"`
  - [x] Test `pnpm changeset add` command

- [x] **Task 4: Create Sample Changeset**
  - [x] Run `pnpm changeset add` for test change
  - [x] Select `@repo/api-types` package
  - [x] Choose `patch` bump
  - [x] Verify `.changeset/[random-name].md` created

- [x] **Task 5: Test Version Bumping**
  - [x] Run `pnpm changeset:version`
  - [x] Verify package.json versions updated
  - [x] Verify CHANGELOG.md created/updated
  - [x] Commit changes with `chore: test changeset workflow`

- [x] **Task 6: Document Workflow**
  - [x] Create/update `CONTRIBUTING.md` with:
    - When to create changesets (feature, fix, breaking change)
    - How to run changeset commands
    - Conventional commit types mapping to bump types
  - [x] Add examples of good changeset descriptions

- [x] **Task 7: (Optional) CI Integration**
  - [x] Create `.github/workflows/changeset-check.yml`
  - [x] Add step to validate changeset presence on PRs
  - [x] Exclude `chore:`, `docs:`, `test:` commits from check

## Technical Guidelines

- **Changeset Types:** `major` (breaking), `minor` (feature), `patch` (fix)
- **Description Format:** User-facing, present tense (e.g., "Add crypto connection API")
- **Multi-Package Changes:** One changeset can affect multiple packages

## Dev Agent Record

**Date:** 2025-12-29

**Implementation Plan:**
Implemented automated version management using Changesets CLI for the Turborepo monorepo. The workflow enables atomic version bumps across multiple packages with automatic CHANGELOG generation.

**Key Implementation Details:**

1. **Base Branch Configuration:** Updated config to use `master` (not `main`) to match repository's actual branch structure
2. **Package Detection:** Verified all 9 workspace packages are correctly detected (apps/web, services/api, packages/\*)
3. **Version Workflow:** Successfully tested patch bump on @repo/api-types (0.0.1 → 0.0.2)
4. **Documentation:** Created comprehensive CONTRIBUTING.md with changeset workflow, conventional commits mapping, and examples
5. **CI Integration:** Added GitHub Actions workflow to validate changeset presence on PRs for feat/fix commits

**Files Created:**

- `.changeset/config.json` - Changesets configuration with baseBranch: "master"
- `.changeset/README.md` - Auto-generated changeset usage instructions
- `CONTRIBUTING.md` - Comprehensive contributor guide with changeset workflow
- `.github/workflows/changeset-check.yml` - PR validation workflow
- `packages/api-types/CHANGELOG.md` - Auto-generated changelog (from test)

**Files Modified:**

- `package.json` (root) - Added changeset, changeset:version, changeset:publish scripts

**Completion Notes:**
✅ All acceptance criteria satisfied:

1. `pnpm changeset` prompts for package selection and change description
2. `pnpm changeset:version` atomically bumps versions and updates CHANGELOGs
3. GitHub Action validates changeset presence for non-chore commits on PRs

**Testing:**

- Installed @changesets/cli successfully
- Created sample changeset for @repo/api-types
- Ran changeset:version to verify version bump (0.0.1 → 0.0.2)
- Verified CHANGELOG.md generation
- Committed with "chore: test changeset workflow"

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Turborepo + Changesets Guide](https://turbo.build/repo/docs/handbook/publishing-packages/versioning-and-publishing)
