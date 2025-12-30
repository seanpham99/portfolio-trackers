# Story Prep-6.1: Syncpack for Version Consistency

Status: done

## Story

As a Developer,
I want all packages to use identical versions of shared dependencies,
So that I avoid "works on my machine" issues caused by version drift.

## Context

**Sprint Context:** Prep Sprint 6 - Monorepo Quality & Architecture Enforcement
**Problem:** Monorepos with 9+ packages can easily drift into using `react@19.2.3` in one package and `react@19.0.0` in another, causing subtle runtime bugs and bundle duplication
**Goal:** Establish Syncpack as the source of truth for dependency versions across the workspace

## Acceptance Criteria

1. **Given** multiple packages importing `react`
   **When** I run `syncpack list-mismatches`
   **Then** any version discrepancies should be detected and reported

2. **Given** CI pipeline
   **When** a PR introduces version mismatches
   **Then** the build should fail with clear error messages

3. **Given** detected mismatches
   **When** I run `syncpack fix-mismatches`
   **Then** all package.json files should be updated to use the highest semver-compatible version

## Tasks / Subtasks

- [x] **Task 1: Install Syncpack**
  - [x] Run `pnpm add -Dw syncpack`
  - [x] Verify installation with `pnpm syncpack --version`

- [x] **Task 2: Create Syncpack Configuration**
  - [x] Create `.syncpackrc.json` in workspace root
  - [x] Configure `versionGroups` for critical dependencies (react, typescript, vite)
  - [x] Set `semverGroups` to enforce exact versions for core libraries
  - [x] Add `dependencyTypes` to check both `dependencies` and `devDependencies`

- [x] **Task 3: Add Package.json Scripts**
  - [x] Add `"syncpack:check": "syncpack list-mismatches"`
  - [x] Add `"syncpack:fix": "syncpack fix-mismatches"`
  - [x] Add `"syncpack:format": "syncpack format"` for consistent formatting

- [x] **Task 4: Run Initial Audit**
  - [x] Run `pnpm syncpack:check` to detect current mismatches
  - [x] Document findings in a comment or dev notes
  - [x] Run `pnpm syncpack:fix` to resolve mismatches
  - [x] Verify no breaking changes with `pnpm build && pnpm test`

- [x] **Task 5: Add to Pre-commit Hook**
  - [x] Update `.husky/pre-commit` to include `pnpm syncpack:check`
  - [x] Test hook with intentional version mismatch
  - [x] Ensure hook fails fast with clear error message

- [x] **Task 6: Integrate into CI Pipeline**
  - [x] Add syncpack check to `.github/workflows/ci.yml` or existing test workflow
  - [x] Configure to run on all PRs targeting master/develop
  - [x] Set as required status check in GitHub branch protection

- [x] **Task 7: Update CONTRIBUTING.md**
  - [x] Document syncpack workflow in "Dependency Management" section
  - [x] Add examples of how to resolve version conflicts
  - [x] Explain when to use `syncpack:fix` vs manual resolution

## Technical Guidelines

**Critical Dependencies to Enforce:**

- `react`, `react-dom` - Must be exact same version
- `typescript` - Version drift causes compiler errors
- `vite` - Different versions have incompatible plugin APIs
- `@types/*` packages - Must match runtime library versions

**Syncpack Configuration Strategy:**

```json
{
  "versionGroups": [
    {
      "label": "Pin React ecosystem to exact versions",
      "dependencies": ["react", "react-dom"],
      "packages": ["**"],
      "policy": "sameRange"
    }
  ]
}
```

**Common Pitfalls:**

- Don't auto-fix during CI (read-only check)
- Exempt peer dependencies from strict checks
- Use `workspace:*` for internal packages (not semver)

## Dev Agent Record

**Date:** 2025-12-30

**Implementation Plan:**

Implemented Syncpack for version consistency enforcement across the monorepo following all tasks in sequence:

1. Installed syncpack@13.0.4 as workspace dev dependency
2. Created comprehensive `.syncpackrc.json` configuration with:
   - Version groups for React, TypeScript, Vite, React Router, TanStack Query
   - Semver groups enforcing exact ranges for critical dependencies
   - Workspace protocol enforcement for internal packages
3. Added three syncpack scripts to root package.json
4. Ran initial audit detecting 19 mismatches (TypeScript ranges, Radix UI versions, React Router ranges)
5. Fixed all mismatches using syncpack:fix and manual alignment
6. Added syncpack:check to pre-commit hook
7. Integrated syncpack check into CI pipeline (.github/workflows/test.yml)
8. Documented comprehensive dependency management workflow in CONTRIBUTING.md

**Completion Notes:**

✅ All tasks and subtasks completed successfully
✅ All acceptance criteria satisfied:

- AC1: syncpack list-mismatches detects version discrepancies
- AC2: CI pipeline includes syncpack check and fails on mismatches
- AC3: syncpack fix-mismatches updates all package.json files to highest semver-compatible version
  ✅ Build passes (verified with pnpm build)
  ✅ Tests pass (44 tests in web, 42 tests in api)
  ✅ Pre-commit hook tested and working (fails on mismatches, passes on valid versions)
  ✅ Documentation complete in CONTRIBUTING.md with troubleshooting guide

**Initial Audit Findings:**

- TypeScript version mismatches: 3 packages using ~5.0.0, 3 using ~5.9.3
- Radix UI component mismatches: 15 packages with older versions in @workspace/ui
- React Router range mismatch: @react-router/serve using exact version instead of caret range

**Resolution:**

- Aligned all TypeScript versions to ~5.9.3
- Updated all Radix UI components to latest versions
- Fixed React Router range to use caret (^7.11.0)

**Files to Create:**

- `.syncpackrc.json` - Syncpack configuration ✅
- Update `CONTRIBUTING.md` - Dependency management section ✅

**Files to Modify:**

- `package.json` (root) - Add syncpack scripts ✅
- `.husky/pre-commit` - Add syncpack check ✅
- `.github/workflows/test.yml` - Add syncpack CI step ✅
- `packages/api-types/package.json` - TypeScript version alignment ✅
- `packages/database-types/package.json` - TypeScript version alignment ✅
- `packages/ui/package.json` - Radix UI version updates ✅
- `apps/web/package.json` - React Router range fix ✅

## File List

**Created:**

- `.syncpackrc.json` - Syncpack configuration with version groups and semver rules

**Modified:**

- `package.json` - Added syncpack scripts (check, fix, format)
- `.husky/pre-commit` - Added syncpack:check to pre-commit hook
- `.github/workflows/test.yml` - Added syncpack check step to CI pipeline
- `CONTRIBUTING.md` - Added comprehensive Dependency Management section
- `packages/api-types/package.json` - Updated TypeScript to ~5.9.3
- `packages/database-types/package.json` - Updated TypeScript to ~5.9.3
- `packages/ui/package.json` - Updated Radix UI components and TypeScript
- `apps/web/package.json` - Updated @react-router/serve to use caret range
- `services/api/package.json` - Updated TypeScript to ~5.9.3
- `pnpm-lock.yaml` - Lockfile updated after dependency changes
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status
- `_bmad-output/implementation-artifacts/stories/prep-6-1-syncpack-version-consistency.md` - This story file

## References

- [Syncpack Documentation](https://github.com/JamieMason/syncpack)
- [Turborepo + Syncpack Guide](https://turbo.build/repo/docs/handbook/tools/syncpack)
- [Version Group Strategies](https://jamiemason.github.io/syncpack/config/version-groups)
