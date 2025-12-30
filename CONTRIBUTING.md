# Contributing to Portfolios Tracker

Thank you for your interest in contributing to Portfolios Tracker! This guide will help you understand our development workflow and contribution guidelines.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Version Management with Changesets](#version-management-with-changesets)
- [Commit Conventions](#commit-conventions)
- [Code Quality Standards](#code-quality-standards)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm 10.26.2 (specified in package.json)
- Docker (for local Supabase development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fin-sight

# Install dependencies
pnpm install

# Start development environment
pnpm dev
```

## Development Workflow

### Monorepo Structure

Portfolios Tracker uses Turborepo for monorepo management with the following structure:

- `apps/web` - React 19 + Vite frontend application
- `services/api` - NestJS backend API
- `packages/*` - Shared packages (ui, api-types, database-types, etc.)

### Running the Project

```bash
# Run all apps in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type-check all packages
pnpm type-check

# Lint all packages
pnpm lint
```

## Version Management with Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs across our monorepo. This ensures consistent versioning and clear release notes.

### When to Create a Changeset

Create a changeset whenever you make changes that should be released:

- ✅ **Features** - New functionality added (minor bump)
- ✅ **Fixes** - Bug fixes (patch bump)
- ✅ **Breaking Changes** - API changes requiring updates (major bump)
- ❌ **Chores** - Refactoring, tooling updates (no changeset needed)
- ❌ **Docs** - Documentation-only changes (no changeset needed)
- ❌ **Tests** - Test-only changes (no changeset needed)

### Creating a Changeset

When you've made changes that affect package functionality:

```bash
# Step 1: Create a changeset
pnpm changeset

# You'll be prompted to:
# 1. Select which packages are affected
# 2. Choose bump type (major/minor/patch)
# 3. Write a user-facing summary of changes
```

The changeset CLI will create a markdown file in `.changeset/` directory.

### Non-Release Changes and Empty Changesets

Our CI checks commit types to decide if a changeset is required. Commits with `feat:`, `fix:`, `perf:`, `refactor:`, or `style:` will trigger a changeset check. If your change does NOT require a release (e.g., internal refactor or styling-only change that doesn't alter a published API), create an empty changeset to satisfy CI:

```bash
# Create an empty changeset when there is no release impact
pnpm changeset add --empty

# Provide a brief explanation, e.g.,
# "Internal refactor; no public API change"
```

Empty changesets document intent and keep the release pipeline honest without bumping versions unnecessarily.

## Pre-Commit Hooks (Husky + lint-staged)

We use Husky and lint-staged to enforce code quality before commits. Hooks run at the root and process only staged files for speed.

### Setup

After a fresh clone or when dependencies change, ensure hooks are initialized:

```bash
pnpm install
pnpm prepare
```

### Behavior

- Runs ESLint with `--fix` on staged `*.{ts,tsx}` files. Warnings do not block commits; errors will.
- Formats staged `*.{ts,tsx,json,md,yaml,yml}` files using Prettier.
- Monorepo-aware: scans files across all workspaces.

Note: We intentionally allow ESLint warnings to pass in pre-commit to keep developer flow fast, especially in tests. Address warnings during regular lint runs (`pnpm lint`) or in PR review.

### Bypass (Escape Hatch)

Use sparingly and only for emergencies:

```bash
git commit --no-verify -m "chore: emergency commit"
```

### Troubleshooting

- If hooks don't run, check `.husky` exists and `pre-commit` is executable
- Ensure ESLint config is accessible in the affected workspace (e.g., `apps/web/eslint.config.js`, `services/api/eslint.config.mjs`).
- For large changes, stage selectively to keep hook runtime low

### Changeset Description Guidelines

Write clear, user-facing descriptions in **present tense**:

✅ **Good Examples:**

```markdown
Add crypto exchange connection API for Binance and OKX
Fix authentication token refresh logic
Add dark mode support to settings page
```

❌ **Bad Examples:**

```markdown
added feature # Past tense
Fixed bug # Too vague
Refactored code # Internal detail, not user-facing
```

### Bump Type Guidelines

| Type      | When to Use                        | Examples                                                  |
| --------- | ---------------------------------- | --------------------------------------------------------- |
| **Patch** | Bug fixes, minor improvements      | Fix input validation error, Update error message          |
| **Minor** | New features (backward compatible) | Add portfolio analytics API, Add export to CSV            |
| **Major** | Breaking changes                   | Change API response structure, Remove deprecated endpoint |

### Mapping Conventional Commits to Changesets

| Commit Type                    | Changeset Type | Description       |
| ------------------------------ | -------------- | ----------------- |
| `feat:`                        | `minor`        | New feature added |
| `fix:`                         | `patch`        | Bug fix           |
| `feat!:` or `BREAKING CHANGE:` | `major`        | Breaking change   |
| `chore:`, `docs:`, `test:`     | No changeset   | Internal changes  |

### Example Workflow

```bash
# 1. Create a feature branch
git checkout -b feat/add-portfolio-export

# 2. Make your changes
# ... edit files ...

# 3. Create a changeset
pnpm changeset
# Select: @repo/api-types, @repo/web
# Type: minor
# Summary: "Add portfolio export to CSV functionality"

# 4. Commit your changes
git add .
git commit -m "feat: add portfolio export to CSV"

# 5. Push and create PR
git push origin feat/add-portfolio-export
```

### Versioning and Publishing (Maintainers Only)

When ready to release:

```bash
# 1. Bump versions and update CHANGELOGs
pnpm changeset:version

# This will:
# - Update package.json versions
# - Generate/update CHANGELOG.md files
# - Delete consumed changeset files

# 2. Commit version changes
git add .
git commit -m "chore: version packages"

# 3. Publish packages (when ready)
pnpm changeset:publish
```

### Multi-Package Changes

If your change affects multiple packages, the changeset CLI will let you select all affected packages:

```bash
pnpm changeset
# Select multiple packages with arrow keys + spacebar
# Example: both @repo/api-types and apps/web might be affected
```

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Common Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks (dependencies, tooling)
- `test:` - Test changes
- `refactor:` - Code refactoring without behavior changes
- `style:` - Code style/formatting changes
- `perf:` - Performance improvements

### Examples

```bash
feat(api): add crypto exchange connection endpoints
fix(web): resolve authentication redirect loop
docs: update README with setup instructions
chore(deps): update React to 19.2.3
test(api): add integration tests for portfolio service
```

### Commitlint Enforcement

- Format: `<type>(<scope>): <subject>` (scope optional)
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`
- Scope: Optional; include feature or package name when helpful (e.g., `api`, `web`)
- Subject: Imperative mood, concise; acronyms permitted (e.g., `README`)
- Hook: Enforced via Husky `commit-msg` using Commitlint

Failed commits will show helpful errors and not be recorded.

### Changelog Generation

- For commit-history-based changelogs grouped by type (feat/fix/chore/etc.):

```bash
pnpm changelog
```

- This updates `CHANGELOG.md` using the Conventional Commits preset.
- For releases across the monorepo, we use Changesets:
  - Create changesets for release-impacting changes: `pnpm changeset`
  - Version and publish: `pnpm changeset:version`, `pnpm changeset:publish`

Clarification: Conventional commits improve history readability; Changesets drive version bumps and release notes per package.

### Interactive Commits (Commitizen)

- Run interactive guided commits:

```bash
pnpm commit
```

- This prompts for type, scope, and subject following the Conventional Commits spec.

### Commit Message Template

Use the local template to stay consistent:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

To use globally:

```bash
git config commit.template .gitmessage
```

## Code Quality Standards

### TypeScript

- Use strict mode (enabled in tsconfig)
- Use path aliases: `@/*` for src files, `@repo/*` for workspace packages
- Use `import type` for type-only imports
- Avoid `any` type (use `unknown` with type guards)

### React

- Use React 19 patterns (Actions, useOptimistic)
- Use React Query for server state
- Use Zustand for UI state only
- Follow file-based routing conventions

### Testing

- Co-locate tests with implementation
- Use Vitest for unit/integration tests
- Test critical hooks and complex logic
- Follow MVP testing strategy (quality over coverage)

### Before Submitting PR

Run these checks before creating a pull request:

```bash
# Type-check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test

# Ensure changeset exists (if needed)
pnpm changeset status
```

## Dependency Management

We use [Syncpack](https://github.com/JamieMason/syncpack) to ensure version consistency across all packages in our monorepo. This prevents "works on my machine" issues caused by version drift.

### Why Version Consistency Matters

In monorepos, different packages can easily drift into using different versions of the same dependency (e.g., `react@19.2.3` in one package and `react@19.0.0` in another). This causes:

- 🐛 Subtle runtime bugs due to API differences
- 📦 Bundle bloat from duplicate dependencies
- ⚠️ Type errors from mismatched @types packages
- 🔄 Inconsistent build behavior across packages

### Checking Version Consistency

Before committing, verify all dependencies use consistent versions:

```bash
# Check for version mismatches
pnpm syncpack:check
```

This command will report any mismatches in:

- React and React DOM versions
- TypeScript versions
- Vite and plugin versions
- React Router versions
- All @types packages

### Fixing Version Mismatches

If `syncpack:check` reports mismatches:

```bash
# Automatically fix mismatches (recommended)
pnpm syncpack:fix

# Verify the fix worked
pnpm syncpack:check

# Test to ensure no breaking changes
pnpm build && pnpm test
```

**Manual Resolution (when auto-fix isn't suitable):**

If you need to choose a specific version:

```bash
# Use interactive prompt to select version
pnpm syncpack prompt
```

### When Adding Dependencies

When adding a new dependency that's already used in other packages:

1. **Check existing versions first:**

   ```bash
   pnpm syncpack:check
   ```

2. **Use the same version range** as other packages (check existing package.json files)

3. **For internal packages**, always use workspace protocol:

   ```json
   {
     "dependencies": {
       "@repo/ui": "workspace:*"
     }
   }
   ```

4. **Run syncpack check** after installation:
   ```bash
   pnpm add <package> --filter <workspace>
   pnpm syncpack:check
   ```

### Critical Dependencies

These dependencies **must** stay synchronized across all packages:

- **React & React DOM** - Different versions cause runtime errors
- **TypeScript** - Version drift causes compiler errors
- **Vite** - Different versions have incompatible plugin APIs
- **React Router** - Must match across all routing packages
- **@types packages** - Must match their runtime library versions

### Automated Checks

Version consistency is automatically checked:

- ✅ **Pre-commit hook** - Runs before every commit
- ✅ **CI pipeline** - Runs on every PR
- ✅ **Pull request checks** - Must pass before merge

If the pre-commit hook fails:

1. Review the reported mismatches
2. Run `pnpm syncpack:fix` to auto-fix
3. Or manually align versions if needed
4. Stage the changes and commit again

### Syncpack Configuration

Our Syncpack configuration (`.syncpackrc.json`) enforces:

- Workspace protocol (`workspace:*`) for internal packages
- Same version ranges for critical dependencies
- Exact minor versions (`~5.9.3`) for TypeScript
- Caret ranges (`^19.2.3`) for React ecosystem

### Troubleshooting

**"SameRangeMismatch" error:**

- Different packages use incompatible version ranges (e.g., `~5.0.0` vs `~5.9.3`)
- Fix: Run `pnpm syncpack:fix` or manually update to the same range

**"HighestSemverMismatch" error:**

- Different packages use different versions within compatible ranges
- Fix: Run `pnpm syncpack:fix` to align to the highest version

**Pre-commit hook fails but you need to commit:**

- Fix the mismatches first - don't bypass the hook
- Version mismatches can cause production issues

## Dead Code Detection

We use [Knip](https://knip.dev/) to detect unused files, exports, dependencies, and more across the entire workspace. This helps keep the codebase lean and maintainable.

### Why Dead Code Detection Matters

Traditional linters like ESLint can't detect project-wide dead code. For example:

- An unused export in `@repo/ui` that no other package imports
- Dependencies installed but never used
- Files that are no longer referenced anywhere
- Types and exports that are defined but never consumed

Knip analyzes the entire workspace dependency graph to identify truly unused code.

### Running Knip

Check for dead code periodically (not on every commit, as it's computationally expensive):

```bash
# Run full dead code analysis
pnpm knip

# Get machine-readable JSON output for CI
pnpm knip:ci

# Automatically remove unused code (use cautiously!)
pnpm knip:fix
```

### Understanding Knip Reports

Knip reports several categories of issues:

**Unused files:**

- Files that are never imported anywhere
- Safe to delete if confirmed unused

**Unused dependencies:**

- Packages in package.json that are never imported
- Remove with `pnpm remove <package>`

**Unused exports:**

- Functions/classes exported but never imported elsewhere
- Consider removing or marking with `@internal` comment

**Unresolved imports:**

- Import paths that can't be resolved
- Usually indicates broken code or misconfigured aliases

**Duplicate exports:**

- Same export name exported multiple times
- Can cause confusion and import errors

### Handling False Positives

Knip may report false positives for:

- **Type-only imports** - May show as unused if only used in type annotations
- **Dynamic imports** - `import('./file')` might not be detected
- **Development dependencies** - Testing tools, build tools
- **Ambient declarations** - `.d.ts` files

To suppress false positives:

1. **Add to knip.json configuration:**

   ```json
   {
     "ignoreDependencies": ["package-name"],
     "ignore": ["path/to/file.ts"]
   }
   ```

2. **Use comments for specific exports:**
   ```typescript
   // @knipignore - Public API surface, don't remove
   export function intentionallyUnusedApi() {}
   ```

### Cleanup Workflow

When Knip reports issues:

1. **Review the report** - Categorize findings into:
   - Safe to delete immediately
   - Needs investigation
   - False positives to ignore

2. **Remove unused dependencies:**

   ```bash
   # Example: Remove unused dependencies
   pnpm remove @radix-ui/react-accordion --filter @repo/web
   ```

3. **Delete unused files:**
   - Verify the file is truly unused
   - Check git history for context
   - Remove and test

4. **Clean up exports:**
   - Remove unused exports from files
   - Or add `@internal` JSDoc comment if needed for future

5. **Verify changes:**
   ```bash
   pnpm build && pnpm test
   ```

### CI Integration

Knip runs in CI as a **warning-only** check (doesn't fail builds). Review warnings in CI output and address them in cleanup sessions.

### Best Practices

- ✅ Run Knip weekly or before major releases
- ✅ Address findings in batches during cleanup sessions
- ✅ Use `--include` flag to focus on specific issue types:
  ```bash
  pnpm knip --include dependencies
  pnpm knip --include files
  pnpm knip --include exports
  ```
- ❌ Don't run on every commit (too slow)
- ❌ Don't auto-fix without review
- ❌ Don't ignore all warnings - they indicate tech debt

### Configuration

Our Knip configuration (knip.json) defines:

- Entry points for each workspace (main files, routes, controllers)
- Project patterns (which files to analyze)
- Ignored patterns (tests, build artifacts)
- Ignored dependencies (build tools, type definitions)

The configuration excludes:

- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Build output (`dist/`, `build/`, `.turbo/`)
- Development config files (`*.config.js`)

## Need Help?

- Check existing issues and PRs
- Review project documentation in `_bmad-output/`
- Ask in team communication channels

---

Thank you for contributing to Portfolios Tracker! 🚀
