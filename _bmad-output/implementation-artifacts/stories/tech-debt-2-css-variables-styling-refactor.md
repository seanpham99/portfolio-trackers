# Tech Debt 2: CSS Variables & Styling System Refactor

**Story Type:** Technical Debt / Refactor  
**Priority:** Medium-High  
**Effort:** 8 Story Points  
**Epic:** Code Quality & Maintainability  
**Date Created:** 2025-12-30  
**Date Updated:** 2025-12-30

---

## Problem Statement

The web app currently uses inconsistent styling approaches:

- **Hardcoded colors**: `bg-zinc-900`, `border-white/6`, `text-white` scattered throughout components
- **Mixed approaches**: Some components use CSS variables (shadcn), others use hardcoded Tailwind colors
- **Maintenance overhead**: Color changes require updating multiple files
- **Theme brittleness**: Components assume dark theme instead of responding to theme system
- **Found 50+ instances** of hardcoded zinc/slate/gray colors and opacity-based white/black values
- **Custom components duplicating shadcn**: `TimeRangeSelector` (should be Tabs), custom navigation (should be Sidebar), custom buttons (should use shadcn Button)
- **Layout inconsistencies**: Dashboard doesn't follow container patterns, protected layout lacks mobile responsiveness

This creates inconsistency, makes theming difficult, violates DRY principles, and misses out on shadcn's accessibility features.

---

## Key Findings

### 🔍 Component Replacement Opportunities

1. **`TimeRangeSelector`** → Replace with **shadcn Tabs**
   - Benefit: Built-in keyboard navigation (arrow keys), ARIA attributes, theme-aware
2. **`_protected._layout.tsx` navigation** → Replace with **shadcn Sidebar**
   - Benefit: Mobile-responsive collapsible sidebar, active state management, accessibility
3. **`LiveIndicator` refresh button** → Use **shadcn Button**
   - Benefit: Consistent icon button styling, proper disabled states

### 🎨 Layout Improvements Required

1. **Dashboard** (`_protected._layout.dashboard.tsx`)
   - Issue: Uses `p-8` instead of container pattern, no max-width, hardcoded `text-white`
   - Fix: Apply STYLE_GUIDE.md container pattern, responsive typography

2. **Protected Layout** (`_protected._layout.tsx`)
   - Issue: No mobile navigation, hardcoded colors (`border-white/6`, `bg-[#0a0a0b]/80`)
   - Fix: Add responsive navigation, use semantic tokens, shadcn Avatar

### 📊 Affected Components

- **8 Auth pages** (high priority user-facing)
- **15 Feature components** (analytics, transactions, portfolio)
- **10 Layout/route components** (critical for structure)
- **Total: ~33 components**

---

## Goals

1. **Centralize styling** in CSS variables within `packages/ui/src/styles/globals.css`
2. **Semantic naming** - Replace `bg-zinc-900` with `bg-surface`, `text-white` with `text-foreground`
3. **Theme-aware** - Components automatically adapt to light/dark mode
4. **Reusable utilities** - Create component classes for common patterns (glass effects, surfaces)
5. **shadcn composition** - Replace custom components with shadcn equivalents
6. **Responsive layouts** - Follow STYLE_GUIDE.md container and grid patterns
7. **Documentation** - Establish style guide for future component development
8. **Future-proof** - Leverage Tailwind v4 CSS-based configuration

---

## Acceptance Criteria

- [ ] **AC1**: CSS variables extended in `globals.css` with semantic color tokens
  - Surface colors: `--surface`, `--surface-elevated`, `--surface-glass`
  - Border variants: `--border-subtle`, `--border-medium`
  - Overlay colors: `--overlay-light`, `--overlay-medium`
  - Exposed to Tailwind via `@theme inline` (Tailwind v4)

- [ ] **AC2**: Component utility classes added to `@layer components`
  - `.glass-card` - Glassmorphism card effect
  - `.glass-card-hover` - With hover transitions
  - `.surface-primary` / `.surface-elevated` / `.surface-elevated-hover`
  - `.skeleton-surface` - Loading state patterns

- [ ] **AC3**: All web app components refactored to use semantic tokens
  - Auth pages (`_auth.login.tsx`, `_auth.sign-up.tsx`, etc.)
  - Feature components (analytics, portfolio, transactions)
  - Layout components (`_protected._layout.tsx`)
  - Shared components (`glass-card.tsx`, `live-indicator.tsx`)

- [ ] **AC4**: Style guide documentation created
  - Location: `packages/ui/README.md` or `docs/STYLE_GUIDE.md`
  - Documents: Color token usage, utility classes, component patterns
  - Includes: Before/after examples, migration guide for future components

- [ ] **AC5**: No regression in visual appearance
  - All components maintain current look and feel
  - Dark mode works identically
  - Light mode tested (if applicable)

- [ ] **AC6**: Tests pass without modification
  - Existing unit/integration tests pass
  - No visual regression in E2E tests (if present)

---

## Implementation Plan

### Phase 1: Foundation (Completed ✅)

- [x] Extend CSS variables in `globals.css`
- [x] Add component utility classes
- [x] Refactor 3 example components (portfolio-card, glass-card, performance-metrics)

### Phase 2: Auth Pages (~8 components)

- [x] `_auth.login.tsx`
- [x] `_auth.sign-up.tsx`
- [x] `_auth.forgot-password.tsx`
- [x] `_auth.update-password.tsx`
- [x] `_auth.tsx` (layout)
- [x] `auth.confirm.tsx`
- [x] `auth.error.tsx`
- [x] `consent-required.tsx`

### Phase 3: Feature Components (~15 components)

**Analytics:**

- [x] `performance-chart.tsx`
- [x] `performance-dashboard.tsx`
- [x] `time-range-selector.tsx` - **Refactored with semantic colors (button replacement deferred)**

**Portfolio:**

- [x] Other portfolio feature components

**Transactions:**

- [x] `add-asset-modal.tsx`
- [x] `asset-autocomplete.tsx`

**Shared:**

- [x] `live-indicator.tsx` - **Component not found (may have been removed)**
- [x] `mode-toggle.tsx` - ✅ Already using shadcn components properly
- [x] Other shared components

### Phase 4: Layout & Routes (~10 components)

**Main Layout:**

- [x] `_protected._layout.tsx` - **Refactored with semantic colors (Sidebar replacement deferred)**
- [x] `_protected._layout.dashboard.tsx` - **Refactored with semantic colors**
- [x] `_protected.tsx` - Fix hardcoded colors

**Portfolio Routes:**

- [x] `_protected._layout.portfolio.$id._index.tsx` - Fix hardcoded colors, improve responsive layout
- [x] `_protected._layout.portfolio.$id.asset.$symbol.tsx`
- [x] `_protected._layout.settings.tsx` - Fix hardcoded text colors

### Phase 5: Documentation

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

  /* New semantic surface colors */
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-surface-glass: var(--surface-glass);

  /* Border variants */
  --color-border-subtle: var(--border-subtle);
  --color-border-medium: var(--border-medium);

  /* Overlays */
  --color-overlay-light: var(--overlay-light);
  --color-overlay-medium: var(--overlay-medium);
}

:root {
  /* Light mode values */
  --surface: oklch(0.98 0 0);
  --surface-elevated: oklch(1 0 0);
  --surface-glass: oklch(1 0 0 / 95%);
  --border-subtle: oklch(0.9 0 0);
  --border-medium: oklch(0.85 0 0);
  --overlay-light: oklch(0 0 0 / 3%);
  --overlay-medium: oklch(0 0 0 / 5%);
}

.dark {
  /* Dark mode values */
  --surface: oklch(0.17 0.02 260);
  --surface-elevated: oklch(0.2 0.02 260);
  --surface-glass: oklch(0.17 0.02 260 / 50%);
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
    @apply rounded-2xl border border-border-subtle bg-surface-glass backdrop-blur-xl shadow-lg;
  }

  .surface-elevated-hover {
    @apply bg-surface-elevated border-border shadow-md transition-all hover:shadow-lg hover:border-border-medium;
  }
}
```

### Migration Pattern

**Before:**

```tsx
<Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700">
  <CardHeader>
    <CardTitle className="text-zinc-400">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-white">Content</div>
  </CardContent>
</Card>
```

**After:**

```tsx
<Card className="surface-elevated-hover">
  <CardHeader>
    <CardTitle className="text-muted-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-foreground">Content</div>
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

## Component Replacement Opportunities

Based on analysis of the codebase against shadcn/ui patterns:

### 1. TimeRangeSelector → shadcn Tabs Component

**Current Implementation** (`time-range-selector.tsx`):

- Custom button group with hardcoded styling
- Manual active state management
- Hardcoded `border-white/6`, `bg-zinc-900/50`

**Recommended Replacement**:

```bash
pnpx shadcn@latest add tabs
```

**Migration Example**:

```tsx
// Before: Custom button group
<div className="inline-flex rounded-lg border border-white/6 bg-zinc-900/50 p-1">
  {TIME_RANGES.map(range => (
    <Button variant={value === range.value ? "default" : "ghost"} />
  ))}
</div>

// After: shadcn Tabs (semantic + accessible)
<Tabs value={value} onValueChange={onChange}>
  <TabsList>
    <TabsTrigger value="1M">1M</TabsTrigger>
    <TabsTrigger value="3M">3M</TabsTrigger>
    <TabsTrigger value="6M">6M</TabsTrigger>
    <TabsTrigger value="1Y">1Y</TabsTrigger>
    <TabsTrigger value="ALL">ALL</TabsTrigger>
  </TabsList>
</Tabs>
```

**Benefits**:

- Automatic keyboard navigation (arrow keys)
- ARIA attributes for screen readers
- Theme-aware styling
- Less code to maintain

---

### 2. Main Navigation → shadcn Sidebar Component

**Current Implementation** (`_protected._layout.tsx`):

- Custom header navigation with manual Link components
- Hardcoded `border-white/6`, `bg-[#0a0a0b]/80`
- No mobile-responsive navigation (burger menu)
- Avatar placeholder with hardcoded `bg-white/5`

**Recommended Replacement**:

```bash
pnpx shadcn@latest add sidebar
pnpx shadcn@latest add avatar
pnpx shadcn@latest add sheet  # For mobile menu fallback
```

**Migration Pattern**:

```tsx
// Before: Custom header navigation
<header className="border-b border-white/6 bg-[#0a0a0b]/80 px-8 py-4 backdrop-blur-xl">
  <nav className="flex items-center gap-6 text-sm">
    <Link className="text-zinc-400 transition-colors hover:text-white" to="/">
      Overview
    </Link>
    {/* More links... */}
  </nav>
</header>

// After: shadcn Sidebar (mobile-responsive + accessible)
<SidebarProvider>
  <AppSidebar>
    <SidebarHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-lg font-semibold text-primary">F</span>
        </div>
        <span className="font-serif text-xl font-light">Portfolios Tracker</span>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link to="/"><LayoutDashboard />Overview</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* More menu items... */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <Avatar>
        <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </SidebarFooter>
  </AppSidebar>
  <main className="flex-1"><Outlet /></main>
</SidebarProvider>
```

**Benefits**:

- Responsive mobile navigation (collapsible sidebar)
- Built-in active state management
- Proper semantic HTML structure
- Accessibility features (keyboard nav, ARIA)
- Theme-aware styling

---

### 3. LiveIndicator Refresh Button → shadcn Button

**Current Implementation** (`live-indicator.tsx`):

- Custom button with hardcoded `border-white/[0.08]`, `bg-white/[0.03]`
- Manual hover states

**Migration**:

```tsx
// Before: Custom button
<button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white">
  <RefreshCw />
</button>;

// After: shadcn Button with icon variant
import { Button } from "@repo/ui/components/button";

<Button
  variant="ghost"
  size="icon"
  onClick={handleRefresh}
  disabled={isRefreshing}
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
  <span className="sr-only">Refresh prices</span>
</Button>;
```

**Additional fixes in LiveIndicator**:

- Replace `text-zinc-500` → `text-muted-foreground`
- Replace `text-zinc-600` → `text-muted-foreground`

---

## Layout Improvements

### Dashboard Layout (`_protected._layout.dashboard.tsx`)

**Current Issues**:

1. Hardcoded `text-white` on heading
2. Inconsistent padding (uses `p-8` instead of container pattern)
3. No max-width constraint (can be too wide on large screens)
4. Grid breakpoints don't match style guide recommendations

**Recommended Refactor**:

```tsx
// Before
return (
  <div className="p-8">
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-white">Portfolios</h1>
      <Button variant="outline">
        <Plus /> New Portfolio
      </Button>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Cards */}
    </div>
  </div>
);

// After: Follow style guide container pattern
return (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
          Portfolios
        </h1>
        <Button
          variant="outline"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> New Portfolio
        </Button>
      </div>

      {/* Grid - responsive mobile-first pattern */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </div>
    </div>
  </div>
);
```

**Benefits**:

- Follows STYLE_GUIDE.md container pattern
- Responsive typography (text size increases on larger screens)
- Max-width constraint prevents content from being too wide
- Button becomes full-width on mobile
- Consistent spacing with style guide

---

### Protected Layout Header (`_protected._layout.tsx`)

**Current Issues**:

1. Hardcoded colors: `border-white/6`, `bg-[#0a0a0b]/80`, `bg-white/10`
2. No mobile responsiveness (navigation will overflow on small screens)
3. Custom avatar with `bg-white/5` instead of shadcn Avatar
4. No active route highlighting
5. Footer with hardcoded `text-zinc-600`

**Critical Fixes**:

```tsx
// Replace colors in header
className="border-b border-border bg-background/80 px-8 py-4 backdrop-blur-xl"

// Replace navigation link colors
className="text-muted-foreground transition-colors hover:text-foreground"

// Replace divider
<div className="h-5 w-px bg-border" />

// Replace footer text color
<p className="text-xs text-muted-foreground">

// Use shadcn Avatar
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';

<Avatar>
  <AvatarFallback className="text-xs">
    {user.email.charAt(0).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

**Responsive Navigation Pattern** (follow style guide):

```tsx
// Add mobile menu (hidden on desktop, visible on mobile)
<div className="lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      {/* Mobile navigation */}
    </SheetContent>
  </Sheet>
</div>

// Desktop navigation (visible on large screens)
<nav className="hidden lg:flex items-center gap-6">
  {/* Navigation links */}
</nav>
```

**Or better yet**: Replace entire layout with shadcn Sidebar (see Component Replacement #2 above).

---

## Impact Analysis

### Files Affected (50+ instances found)

**Auth Pages (High Priority - 8 components):**

- `apps/web/src/routes/_auth.login.tsx`
- `apps/web/src/routes/_auth.sign-up.tsx`
- `apps/web/src/routes/_auth.forgot-password.tsx`
- `apps/web/src/routes/_auth.update-password.tsx`
- `apps/web/src/routes/_auth.tsx`
- `apps/web/src/routes/auth.confirm.tsx`
- `apps/web/src/routes/auth.error.tsx`
- `apps/web/src/routes/consent-required.tsx`

**Feature Components (~15 components):**

Analytics:

- `apps/web/src/features/analytics/performance-chart.tsx`
- `apps/web/src/features/analytics/performance-dashboard.tsx`
- `apps/web/src/features/analytics/performance-metrics.tsx`
- `apps/web/src/features/analytics/time-range-selector.tsx` ⚠️ **Replace with shadcn Tabs**

Transactions:

- `apps/web/src/features/transactions/add-asset-modal.tsx`
- `apps/web/src/features/transactions/asset-autocomplete.tsx`
- `apps/web/src/features/transactions/transaction-form.tsx`

Auth:

- `apps/web/src/features/auth/privacy-consent-modal.tsx`

Shared:

- `apps/web/src/components/live-indicator.tsx` ⚠️ **Refactor to use shadcn Button**
- `apps/web/src/components/mode-toggle.tsx` ✅ Already using shadcn properly
- `apps/web/src/components/glass-card.tsx` ✅ Already refactored (Phase 1)

**Layout & Routes (10 components):**

Main Layout:

- `apps/web/src/routes/_protected._layout.tsx` 🔥 **Critical: Replace with shadcn Sidebar**
- `apps/web/src/routes/_protected._layout.dashboard.tsx` 🔥 **Critical: Fix container pattern**
- `apps/web/src/routes/_protected.tsx`

Portfolio Routes:

- `apps/web/src/routes/_protected._layout.portfolio.$id._index.tsx`
- `apps/web/src/routes/_protected._layout.portfolio.$id.asset.$symbol.tsx`

Settings:

- `apps/web/src/routes/_protected._layout.settings.tsx`

### Benefits

1. **Maintainability**: Single source of truth for colors
2. **Consistency**: All components follow same patterns + shadcn composition
3. **Theming**: Easy to adjust theme system-wide
4. **Developer Experience**: Clear semantic naming + shadcn CLI integration
5. **Future-proof**: Tailwind v4 native approach
6. **Accessibility**: WCAG compliance + shadcn's built-in a11y features
7. **Mobile Responsive**: Sidebar component provides collapsible mobile navigation
8. **Code Reduction**: Replacing custom components reduces maintenance burden

### Risks

- **Visual regressions** - Mitigated by thorough testing and incremental approach
- **Development velocity** - Temporary slowdown during refactor - Mitigated by clear examples and documentation
- **Merge conflicts** - If multiple features in flight - Mitigated by doing this work in dedicated branch/PR
- **Layout shifts** - Sidebar component changes layout structure - Mitigated by testing all routes

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

- [ ] Visual appearance matches original
- [ ] Dark mode works correctly
- [ ] Light mode works correctly (if applicable)
- [ ] Hover states function properly
- [ ] Focus states visible
- [ ] No console warnings/errors

---

## Documentation Deliverables

### Style Guide (`packages/ui/STYLE_GUIDE.md`)

Comprehensive UI/UX design system documentation including:

1. **Color System Overview**
   - CSS variable architecture
   - Semantic token naming (base + extended)
   - Light/dark mode strategy with OKLCH colors

2. **Typography System**
   - Font stack and type scale
   - Semantic usage for headings, body, captions
   - Financial display font patterns (serif for elegance)

3. **Layout System**
   - Container widths and breakpoints
   - Responsive grid patterns
   - Flex layout patterns

4. **Spacing & Sizing**
   - Tailwind spacing scale usage
   - Common spacing patterns
   - Card padding conventions

5. **Component Utilities**
   - `.glass-card` usage and variants
   - `.surface-*` patterns
   - `.skeleton-surface` for loading states

6. **Component Patterns (shadcn/ui)**
   - How to extend shadcn components (composition over duplication)
   - Card, form, dialog, table patterns
   - Badge, skeleton, button patterns
   - **Always use `pnpx shadcn@latest add <component>`**

7. **Responsive Design**
   - Mobile-first approach
   - Responsive patterns and utilities
   - Touch-friendly sizing (44x44px minimum)

8. **Accessibility (WCAG 2.1 AA)**
   - Keyboard navigation patterns
   - ARIA attributes and roles
   - Focus management
   - Color contrast compliance

9. **Motion & Animation**
   - Framer Motion patterns
   - Reduced motion support
   - CSS transition utilities

10. **Data Visualization**
    - TradingView widget integration
    - Recharts fallback patterns
    - Financial data table styling
    - Progress and allocation indicators

11. **Migration Guide**
    - Common color replacements table
    - Before/after code examples
    - Decision tree for choosing tokens

12. **Best Practices**
    - When to use semantic vs design tokens
    - How to add new color tokens
    - Composition over duplication
    - shadcn/ui integration guidelines

### Update CONTRIBUTING.md

Add section: **Styling Guidelines**

- Link to style guide
- Enforce semantic token usage
- Pre-commit hook consideration (optional)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All phases completed
- [ ] No hardcoded zinc/slate/gray colors remain in web app
- [ ] Style guide documentation written
- [ ] CONTRIBUTING.md updated
- [ ] Visual QA passed (no regressions)
- [ ] All tests passing
- [ ] PR reviewed and approved
- [ ] Changeset created (refactor type, empty if no API change)

---

## Component Replacement Opportunities

Based on analysis of the codebase against shadcn/ui patterns:

### 1. TimeRangeSelector → shadcn Tabs Component

**Current Implementation** (`time-range-selector.tsx`):

- Custom button group with hardcoded styling
- Manual active state management
- Hardcoded `border-white/6`, `bg-zinc-900/50`

**Recommended Replacement**:

```bash
pnpx shadcn@latest add tabs
```

**Migration Example**:

```tsx
// Before: Custom button group
<div className="inline-flex rounded-lg border border-white/6 bg-zinc-900/50 p-1">
  {TIME_RANGES.map(range => (
    <Button variant={value === range.value ? "default" : "ghost"} />
  ))}
</div>

// After: shadcn Tabs (semantic + accessible)
<Tabs value={value} onValueChange={onChange}>
  <TabsList>
    <TabsTrigger value="1M">1M</TabsTrigger>
    <TabsTrigger value="3M">3M</TabsTrigger>
    <TabsTrigger value="6M">6M</TabsTrigger>
    <TabsTrigger value="1Y">1Y</TabsTrigger>
    <TabsTrigger value="ALL">ALL</TabsTrigger>
  </TabsList>
</Tabs>
```

**Benefits**:

- Automatic keyboard navigation (arrow keys)
- ARIA attributes for screen readers
- Theme-aware styling
- Less code to maintain

---

### 2. Main Navigation → shadcn Sidebar Component

**Current Implementation** (`_protected._layout.tsx`):

- Custom header navigation with manual Link components
- Hardcoded `border-white/6`, `bg-[#0a0a0b]/80`
- No mobile-responsive navigation (burger menu)
- Avatar placeholder with hardcoded `bg-white/5`

**Recommended Replacement**:

```bash
pnpx shadcn@latest add sidebar
pnpx shadcn@latest add avatar
```

**Migration Pattern**:

```tsx
// Before: Custom header navigation
<header className="border-b border-white/6 bg-[#0a0a0b]/80 px-8 py-4 backdrop-blur-xl">
  <nav className="flex items-center gap-6 text-sm">
    <Link className="text-zinc-400 transition-colors hover:text-white" to="/">
      Overview
    </Link>
    {/* More links... */}
  </nav>
</header>

// After: shadcn Sidebar (mobile-responsive + accessible)
<SidebarProvider>
  <AppSidebar>
    <SidebarHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-lg font-semibold text-primary">F</span>
        </div>
        <span className="font-serif text-xl font-light">Portfolios Tracker</span>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/"><LayoutDashboard />Overview</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* More menu items... */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <Avatar>
        <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </SidebarFooter>
  </AppSidebar>
  <main><Outlet /></main>
</SidebarProvider>
```

**Benefits**:

- Responsive mobile navigation (collapsible sidebar)
- Built-in active state management
- Proper semantic HTML structure
- Accessibility features (keyboard nav, ARIA)
- Theme-aware styling

---

### 3. LiveIndicator Refresh Button → shadcn Button

**Current Implementation** (`live-indicator.tsx`):

- Custom button with hardcoded `border-white/[0.08]`, `bg-white/[0.03]`
- Manual hover states

**Migration**:

```tsx
// Before: Custom button
<button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white">
  <RefreshCw />
</button>;

// After: shadcn Button with icon variant
import { Button } from "@repo/ui/components/button";

<Button
  variant="ghost"
  size="icon"
  onClick={handleRefresh}
  disabled={isRefreshing}
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
  <span className="sr-only">Refresh prices</span>
</Button>;
```

**Additional fixes in LiveIndicator**:

- Replace `text-zinc-500` → `text-muted-foreground`
- Replace `text-zinc-600` → `text-muted-foreground`

---

## Layout Improvements

### Dashboard Layout (`_protected._layout.dashboard.tsx`)

**Current Issues**:

1. Hardcoded `text-white` on heading
2. Inconsistent padding (uses `p-8` instead of container pattern)
3. No max-width constraint (can be too wide on large screens)
4. Grid breakpoints don't match style guide recommendations

**Recommended Refactor**:

```tsx
// Before
return (
  <div className="p-8">
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-white">Portfolios</h1>
      <Button variant="outline">
        <Plus /> New Portfolio
      </Button>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Cards */}
    </div>
  </div>
);

// After: Follow style guide container pattern
return (
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
          Portfolios
        </h1>
        <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Portfolio
        </Button>
      </div>

      {/* Grid - responsive mobile-first pattern */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </div>
    </div>
  </div>
);
```

**Benefits**:

- Follows STYLE_GUIDE.md container pattern
- Responsive typography (text size increases on larger screens)
- Max-width constraint prevents content from being too wide
- Consistent spacing with style guide

---

### Protected Layout Header (`_protected._layout.tsx`)

**Current Issues**:

1. Hardcoded colors: `border-white/6`, `bg-[#0a0a0b]/80`, `bg-white/10`
2. No mobile responsiveness (navigation will overflow on small screens)
3. Custom avatar with `bg-white/5` instead of shadcn Avatar
4. No active route highlighting
5. Footer with hardcoded `text-zinc-600`

**Critical Fixes**:

```tsx
// Replace colors in header
className="border-b border-border bg-background/80 px-8 py-4 backdrop-blur-xl"

// Replace navigation link colors
className="text-muted-foreground transition-colors hover:text-foreground"

// Replace divider
<div className="h-5 w-px bg-border" />

// Replace footer text color
<p className="text-xs text-muted-foreground">

// Use shadcn Avatar
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';

<Avatar>
  <AvatarFallback className="text-xs">{user.email.charAt(0).toUpperCase()}</AvatarFallback>
</Avatar>
```

**Responsive Navigation Pattern** (follow style guide):

```tsx
// Add mobile menu (hidden on desktop, visible on mobile)
<div className="lg:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left">
      {/* Mobile navigation */}
    </SheetContent>
  </Sheet>
</div>

// Desktop navigation (visible on large screens)
<nav className="hidden lg:flex items-center gap-6">
  {/* Navigation links */}
</nav>
```

Or better yet, **replace entire layout with shadcn Sidebar** (see Component Replacement #2 above).

---

## Related Work

- **Prerequisite**: None (can start immediately)
- **Blocks**: None
- **Related Stories**:
  - `tech-debt-1-legacy-mock-components-cleanup.md` (complementary tech debt)
  - `prep-*` stories (quality improvements)

---

## Notes

- **Phase 1 completed**: Foundation laid with CSS variables, utilities, and 3 example components
- **Phase 5 completed**: Comprehensive style guide created with 13 major sections
- **Component Replacements Identified**:
  - `TimeRangeSelector` → shadcn Tabs (better a11y, keyboard nav)
  - `_protected._layout.tsx` → shadcn Sidebar (mobile responsive, active states)
  - `LiveIndicator` button → shadcn Button (consistent styling)
- **Layout Improvements Required**:
  - Dashboard: Fix container pattern, responsive typography
  - Protected Layout: Mobile navigation, semantic tokens
- **Incremental approach**: Can merge phase by phase to reduce PR size
- **No breaking changes**: Pure refactor, no API changes (component replacements maintain same props)
- **Empty changeset**: Create empty changeset per CONTRIBUTING.md since this is internal styling refactor
- **shadcn/ui integration**: Always use `pnpx shadcn@latest add <component>` before implementing custom solutions
- **Total affected files**: ~33 components (8 auth + 15 features + 10 layouts/routes)

---

## Appendix: Search Query for Remaining Work

```bash
# Find all remaining hardcoded color instances
grep -r "bg-zinc-\|bg-slate-\|bg-gray-\|border-zinc-\|border-white/\|bg-white/\[" \
  apps/web/src --include="*.tsx" | wc -l
```

Current count: **50+ instances**

Target: **0 instances**
