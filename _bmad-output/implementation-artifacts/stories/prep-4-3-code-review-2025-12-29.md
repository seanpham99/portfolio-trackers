# Code Review Findings: Prep-4.3 Conventional Commits & Commit Linting (2025-12-29)

Story: \_bmad-output/implementation-artifacts/stories/prep-4-3-conventional-commits-commitlint.md
Reviewer: Adversarial Senior Dev

## Summary

- Git vs Story Discrepancies: 0 high discrepancies (story File List matches staged changes)
- Issues Found: 2 High, 3 Medium, 2 Low

## 🔴 High Severity

1. Acceptance Criteria #3 (changelog grouped by type) not validated/automated.
   - Observation: No script or documented step to generate changelog from conventional commits; current setup relies on Changesets, which generates changelogs from changeset files, not commit history.
   - Impact: Requirement not fully met; release notes may not reflect commit types unless changesets are authored.
   - Suggestion: Add `changeset` workflow doc for changelog generation and clarify mapping or integrate `conventional-changelog` for commit-history based changelog where needed.

2. Linting pipeline failing in `packages/vite-config` (ESLint v9 config missing).
   - Evidence: `pnpm run lint` exits with code 2 due to missing `eslint.config.js`.
   - Impact: Repository quality checks fail; unrelated to this story but blocks CI quality gates.
   - Suggestion: Add `eslint.config.js` in `packages/vite-config` or align eslint runner scope.

## 🟡 Medium Severity

3. `scope-empty` rule warns on empty scope.
   - Observation: Acceptance Criteria do not require scope; warnings create noise.
   - Suggestion: Set `scope-empty` to `[0, "never"]` (disable) or document when to use scopes.

4. `wip` type allowed.
   - Observation: Permitting `wip` may encourage lower-quality commits.
   - Suggestion: Remove `wip` from `type-enum` or enforce via docs that `wip` commits are temporary and not pushed.

5. CONTRIBUTING mapping mixes commit-type checks with Changesets expectations.
   - Observation: Section suggests CI checks based on commit types; current tooling uses Changesets CLI, not commit messages.
   - Suggestion: Clarify that release bumping is driven by changesets, and conventional commits improve history readability.

## 🟢 Low Severity

6. `subject-case` disabled globally.
   - Observation: Allows acronyms like README, but also permits inconsistent casing.
   - Suggestion: Consider custom regex rule to allow common acronyms while encouraging sentence/lower case.

7. Missing explicit example of changelog generation.
   - Observation: Docs describe mapping but lack a concrete command example.
   - Suggestion: Add a section: "Generate changelog via Changesets" with `pnpm changeset:version`/`pnpm changeset:publish` examples and how CHANGELOG groups entries.

## Git vs Story File List

- Staged files:
  - `.gitmessage`
  - `.husky/commit-msg`
  - `CONTRIBUTING.md`
  - `_bmad-output/implementation-artifacts/sprint-status.yaml`
  - `_bmad-output/implementation-artifacts/stories/prep-4-3-conventional-commits-commitlint.md`
  - `commitlint.config.js`
  - `package.json`
  - `pnpm-lock.yaml`
- Story File List includes all above (pnpm-lock.yaml noted). No discrepancies.

## Next Actions

Choose an option:

1. Fix HIGH and MEDIUM issues now (adjust rules/docs; add eslint config; add changelog guidance)
2. Create action items in story (Review Follow-ups [AI])
3. Show detailed deep dive for a specific issue
