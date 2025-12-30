# Tech Debt 2: CSS Variables & Styling System Refactor

**Story Type:** Technical Debt / Refactor  
**Priority:** Medium-High  
**Effort:** 5 Story Points  
**Epic:** Code Quality & Maintainability  
**Date Created:** 2025-12-30  
**Date Updated:** 2025-12-30  
**Status:** Done ✅

---

## Problem Statement

The web app currently uses inconsistent styling approaches:

- **Hardcoded colors**: `bg-zinc-900`, `border-white/6`, `text-white` scattered throughout components
- **Mixed approaches**: Some components use CSS variables (shadcn), others use hardcoded Tailwind colors
- **Maintenance overhead**: Color changes require updating multiple files
- **Theme brittleness**: Components assume dark theme instead of responding to theme system
- **Found 50+ instances** of hardcoded zinc/slate/gray colors and opacity-based white/black values

This creates inconsistency and makes theming difficult. Layout inconsistencies and component replacements are handled in separate stories (Tech Debt 3 and Tech Debt 4).

---

## Scope

This story focuses exclusively on **CSS variables and semantic token refactoring**:

- Extending CSS variables in `globals.css`
- Creating component utility classes
- Replacing hardcoded colors with semantic tokens
- Creating comprehensive style guide documentation

**Out of Scope** (handled in separate stories):

- Layout consistency and responsive patterns → **Tech Debt 3**
- Component replacements (Tabs, Sidebar, etc.) → **Tech Debt 4**

---

## Goals

1. **Centralize styling** in CSS variables within `packages/ui/src/styles/globals.css`
2. **Semantic naming** - Replace `bg-zinc-900` with `bg-surface`, `text-white` with `text-foreground`
3. **Theme-aware** - Components automatically adapt to light/dark mode
4. **Reusable utilities** - Create component classes for common patterns (glass effects, surfaces)
5. **Documentation** - Establish style guide for future component development
6. **Future-proof** - Leverage Tailwind v4 CSS-based configuration

---

## Acceptance Criteria

- [x] **AC1**: CSS variables extended in `globals.css` with semantic color tokens
  - Surface colors: `--surface`, `--surface-elevated`, `--surface-glass`
  - Border colors: `--border-subtle`, `--border-medium`
  - Overlay colors: `--overlay-light`, `--overlay-medium`
  - Exposed to Tailwind via `@theme inline` (Tailwind v4)

- [x] **AC2**: Component utility classes added to `@layer components`
  - `.glass-card` - Glassmorphism card effect
  - `.surface-elevated` - Elevated surface pattern
  - `.surface-elevated-hover` - Elevated surface with hover state
  - `.skeleton-surface` - Loading state patterns

- [x] **AC3**: All web app components refactored to use semantic tokens
  - Auth pages (`_auth.login.tsx`, `_auth.sign-up.tsx`, etc.)
  - Feature components (analytics, transactions, portfolio)
  - Layout components (`_protected._layout.tsx`, dashboard, etc.)
  - Shared components (`glass-card.tsx`, `live-indicator.tsx`)

- [x] **AC4**: Style guide documentation created
  - Location: `packages/ui/STYLE_GUIDE.md`
  - Comprehensive color system documentation
  - Includes: Before/after examples, migration guide for future components

- [x] **AC5**: No regression in visual appearance
  - All components maintain current look and feel
  - Dark mode tested
  - Light mode tested (if applicable)

- [x] **AC6**: Tests pass without modification
  - Existing unit/integration tests pass
  - No visual regression in E2E tests (if present)

---

## Implementation Plan

### Phase 1: Foundation (Completed ✅)

- [x] Extend CSS variables in `globals.css`
- [x] Add component utility classes
- [x] Refactor 3 example components (portfolio-card, glass-card, performance-metrics)

### Phase 2: Auth Pages (~8 components) (Completed ✅)

- [x] `_auth.login.tsx`
- [x] `_auth.sign-up.tsx`
- [x] `_auth.forgot-password.tsx`
- [x] `_auth.update-password.tsx`
- [x] `_auth.tsx` (layout)
- [x] `auth.confirm.tsx`
- [x] `auth.error.tsx`
- [x] `consent-required.tsx`

### Phase 3: Feature Components (~15 components) (Completed ✅)

**Analytics:**

- [x] `performance-chart.tsx`
- [x] `performance-dashboard.tsx`
- [x] `time-range-selector.tsx` - Refactored with semantic colors

**Portfolio:**

- [x] Portfolio feature components

**Transactions:**

- [x] `add-asset-modal.tsx`
- [x] `asset-autocomplete.tsx`

**Shared:**

- [x] `live-indicator.tsx` - Component not found (may have been removed)
- [x] `mode-toggle.tsx` - Already using shadcn components properly

### Phase 4: Layout & Routes (~10 components) (Completed ✅)

**Main Layout:**

- [x] `_protected._layout.tsx` - Refactored with semantic colors
- [x] `_protected._layout.dashboard.tsx` - Refactored with semantic colors
- [x] `_protected.tsx` - Fixed hardcoded colors

**Portfolio Routes:**

- [x] `_protected._layout.portfolio.$id._index.tsx` - Fixed hardcoded colors
- [x] `_protected._layout.portfolio.$id.asset.$symbol.tsx` - Fixed hardcoded colors
- [x] `_protected._layout.settings.tsx` - Fixed hardcoded text colors

### Phase 5: Documentation (Completed ✅)

- [x] Create comprehensive style guide in `packages/ui/STYLE_GUIDE.md`
- [x] Document color token system
- [x] Document typography scale and usage
- [x] Document layout system and grid patterns
- [x] Document spacing and sizing conventions
- [x] Document component patterns with shadcn/ui
- [x] Document responsive design approach
- [x] Document accessibility patterns (WCAG 2.1 AA)
- [x] Document motion and animation guidelines
- [x] Document data visualization patterns
- [x] Provide migration examples with before/after
- [x] Update CONTRIBUTING.md with styling guidelines

---

## Technical Details

### CSS Variables Structure (Tailwind v4)

```css
/* packages/ui/src/styles/globals.css */

@theme inline {
  /* Existing shadcn colors... */

  /* Extended semantic tokens */
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-glass: var(--surface-glass);
  --color-border-subtle: var(--border-subtle);
  --color-border-medium: var(--border-medium);
  --color-overlay-light: var(--overlay-light);
  --color-overlay-medium: var(--overlay-medium);
}

:root {
  /* Light mode values */
  --surface: oklch(0.98 0 0);
  --surface-elevated: oklch(1 0 0);
  --surface-glass: oklch(0.98 0 0 / 80%);
  --border-subtle: oklch(0 0 0 / 6%);
  --border-medium: oklch(0 0 0 / 12%);
  --overlay-light: oklch(0 0 0 / 3%);
  --overlay-medium: oklch(0 0 0 / 5%);
}

.dark {
  /* Dark mode values */
  --surface: oklch(0.17 0 0);
  --surface-elevated: oklch(0.19 0 0);
  --surface-glass: oklch(0.17 0 0 / 80%);
  --border-subtle: oklch(1 0 0 / 6%);
  --border-medium: oklch(1 0 0 / 12%);
  --overlay-light: oklch(1 0 0 / 3%);
  --overlay-medium: oklch(1 0 0 / 5%);
}
```

### Component Utilities

```css
@layer components {
  .glass-card {
    @apply surface-glass backdrop-blur-xl border border-border-subtle;
  }

  .surface-elevated {
    @apply bg-surface-elevated border border-border;
  }

  .surface-elevated-hover {
    @apply surface-elevated hover:border-border-medium transition-colors;
  }
}
```

### Migration Pattern

**Before:**

```tsx
<Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-zinc-400">Content</div>
  </CardContent>
</Card>
```

**After:**

```tsx
<Card className="surface-elevated-hover">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-muted-foreground">Content</div>
  </CardContent>
</Card>
```

### Common Replacements

| Hardcoded         | Semantic Token          | Usage                         |
| ----------------- | ----------------------- | ----------------------------- |
| `bg-zinc-900`     | `bg-surface`            | Standard surface background   |
| `bg-zinc-900/50`  | `bg-surface-glass`      | Semi-transparent glass effect |
| `bg-zinc-950`     | `bg-background`         | Page background               |
| `border-zinc-800` | `border-border`         | Standard borders              |
| `border-white/6`  | `border-border-subtle`  | Subtle borders                |
| `border-white/12` | `border-border-medium`  | Medium emphasis borders       |
| `text-white`      | `text-foreground`       | Primary text                  |
| `text-zinc-400`   | `text-muted-foreground` | Secondary text                |
| `text-zinc-500`   | `text-muted-foreground` | Muted text                    |
| `bg-white/[0.03]` | `bg-overlay-light`      | Light overlay                 |
| `bg-white/[0.05]` | `bg-overlay-medium`     | Medium overlay                |

---

## Impact Analysis

### Files Affected (~33 components)

**Auth Pages (8 components):**

- All auth routes refactored with semantic tokens

**Feature Components (~15 components):**

- Analytics, portfolio, transactions, and shared components refactored

**Layout & Routes (~10 components):**

- Main layouts and route components refactored

### Benefits

1. **Maintainability**: Single source of truth for colors
2. **Consistency**: All components follow same semantic token patterns
3. **Theming**: Easy to adjust theme system-wide
4. **Developer Experience**: Clear semantic naming
5. **Future-proof**: Tailwind v4 native approach

### Risks

- **Visual regressions** - Mitigated by thorough testing and incremental approach
- **Development velocity** - Temporary slowdown during refactor - Mitigated by clear examples and documentation
- **Merge conflicts** - If multiple features in flight - Mitigated by doing this work in dedicated branch/PR

---

## Testing Strategy

### Visual Regression Testing

1. **Manual QA**: Test each page in light/dark mode
2. **Screenshot comparison**: Before/after screenshots of key pages
3. **Cross-browser**: Test in Chrome, Firefox, Safari

### Automated Testing

1. **Unit tests**: Ensure existing component tests pass
2. **Integration tests**: Verify theme switching still works
3. **Storybook** (if applicable): Update component stories

### Checklist Per Component

- [x] Visual appearance matches original
- [x] Dark mode works correctly
- [x] Light mode works correctly (if applicable)
- [x] Hover states function properly
- [x] Focus states visible
- [x] No console warnings/errors

---

## Definition of Done

- [x] All acceptance criteria met
- [x] All phases completed
- [x] No hardcoded zinc/slate/gray colors remain in web app (or minimal)
- [x] Style guide documentation written
- [x] CONTRIBUTING.md updated
- [x] Visual QA passed (no regressions)
- [x] All tests passing
- [x] PR reviewed and approved
- [x] Changeset created (refactor type, empty if no API change)

---

## Related Work

- **Blocks**: Tech Debt 3 (Layout Component Consistency) - Depends on semantic tokens
- **Blocks**: Tech Debt 4 (shadcn Component Replacements) - Depends on semantic tokens
- **Completed**: 2025-12-30

---

## Notes

- **All 5 phases completed** successfully
- **Comprehensive style guide** created with 13 major sections in `packages/ui/STYLE_GUIDE.md`
- **No breaking changes**: Pure refactor, no API changes
- **Empty changeset**: Created per CONTRIBUTING.md guidelines for internal styling refactor
- **Future work**: Component replacements and layout improvements split into separate stories for clarity
- **Total affected files**: ~33 components successfully refactored
