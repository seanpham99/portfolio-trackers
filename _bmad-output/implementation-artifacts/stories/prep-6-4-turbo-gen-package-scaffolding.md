# Story Prep-6.4: Turbo Gen for Package Scaffolding

Status: backlog

## Story

As a Developer,
I want standardized templates for creating new packages,
So that every package starts with correct tsconfig, eslint, and package.json configs.

## Context

**Sprint Context:** Prep Sprint 6 - Monorepo Quality & Architecture Enforcement
**Problem:** Manually creating packages leads to inconsistencies (missing tsconfig extends, wrong eslint config, forgotten workspace:\* protocol)
**Goal:** Use Turbo Gen to scaffold packages with pre-configured templates

## Acceptance Criteria

1. **Given** Turbo Gen installed
   **When** I run `turbo gen package`
   **Then** it should prompt for package name and type (app/library/service)

2. **Given** a package template
   **When** generation completes
   **Then** the new package should include: package.json with workspace:\* deps, tsconfig.json extending @workspace/typescript-config, README.md

3. **Given** template configuration
   **When** creating a new package
   **Then** it should be automatically added to pnpm-workspace.yaml and turbo.json

## Tasks / Subtasks

- [ ] **Task 1: Verify Turbo Gen Installation**
  - [ ] Check if `@turbo/gen` is installed (already in package.json)
  - [ ] Run `pnpm turbo gen --help` to verify CLI availability
  - [ ] Review existing generator configuration (if any)

- [ ] **Task 2: Create Package Templates**
  - [ ] Create `turbo/generators/config.ts` (or use default location)
  - [ ] Define generator for "React Library" (packages/ui-\*)
  - [ ] Define generator for "Node.js Service" (services/\*)
  - [ ] Define generator for "TypeScript Library" (packages/\*)

- [ ] **Task 3: Configure React Library Template**
  - [ ] Template files:
    - `package.json` with name, version, main, types, scripts
    - `tsconfig.json` extending `@workspace/typescript-config/base.json`
    - `src/index.ts` with sample export
    - `README.md` with usage instructions
    - `.eslintrc.js` extending `@workspace/eslint-config/react`
  - [ ] Variables: `{{ packageName }}`, `{{ description }}`

- [ ] **Task 4: Configure Node.js Service Template**
  - [ ] Template files:
    - `package.json` with NestJS dependencies
    - `tsconfig.json` for Node.js
    - `nest-cli.json`
    - `src/main.ts` with basic NestJS bootstrap
    - `template.env`
    - `Dockerfile`
  - [ ] Variables: `{{ serviceName }}`, `{{ port }}`

- [ ] **Task 5: Configure TypeScript Library Template**
  - [ ] Template files:
    - `package.json` with build scripts
    - `tsconfig.json` extending base config
    - `src/index.ts`
    - `README.md`
  - [ ] Variables: `{{ libName }}`, `{{ description }}`

- [ ] **Task 6: Add Post-Generation Hooks**
  - [ ] Hook 1: Add package to `pnpm-workspace.yaml` automatically
  - [ ] Hook 2: Add package to `turbo.json` pipeline configuration
  - [ ] Hook 3: Run `pnpm install` to link new package
  - [ ] Hook 4: Output success message with next steps

- [ ] **Task 7: Test Generators**
  - [ ] Run `turbo gen package` and create test library
  - [ ] Verify all files generated correctly
  - [ ] Run `pnpm build` in new package to ensure it compiles
  - [ ] Delete test package after validation

- [ ] **Task 8: Document in CONTRIBUTING.md**
  - [ ] Add "Creating New Packages" section
  - [ ] List available generators (library, service, app)
  - [ ] Provide examples of running generators
  - [ ] Document manual steps if any (e.g., updating turbo.json filters)

## Technical Guidelines

**Turbo Gen Configuration Structure:**

```typescript
// turbo/generators/config.ts
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Generate a new workspace package",
    prompts: [
      {
        type: "list",
        name: "type",
        message: "Package type?",
        choices: ["library", "service", "app"],
      },
      {
        type: "input",
        name: "name",
        message: "Package name?",
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "{{ turbo.paths.root }}/packages/{{ name }}",
        templateFiles: "templates/library/**",
      },
    ],
  });
}
```

**Package Template Best Practices:**

- Use `workspace:*` for internal dependencies (not semver)
- Extend shared configs (don't duplicate)
- Include `.gitignore` to exclude `dist/`, `node_modules/`
- Add `files` field in package.json (only ship `dist/`)

**Post-Generation Checklist:**

1. Verify package appears in `pnpm list -r`
2. Check `turbo.json` has package in pipeline
3. Run `pnpm build` from root to test integration
4. Update `README.md` with package purpose

## Dev Agent Record

**Date:** 2025-12-29

**Files to Create:**

- `turbo/generators/config.ts` - Generator configuration
- `turbo/generators/templates/library/**` - Library template files
- `turbo/generators/templates/service/**` - Service template files
- Update `CONTRIBUTING.md` - Package scaffolding section

**Files to Modify:**

- None (templates are net new)

## References

- [Turbo Gen Documentation](https://turbo.build/repo/docs/core-concepts/monorepos/code-generation)
- [Plop.js (underlying library)](https://plopjs.com/)
- [Generator Examples](https://github.com/vercel/turbo/tree/main/examples/with-pnpm)
- [Template Variables Reference](https://turbo.build/repo/docs/reference/generate)
