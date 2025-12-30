# Tech Debt 4: shadcn/ui Component Replacements

**Story Type:** Technical Debt / Refactor  
**Priority:** Medium  
**Effort:** 5-8 Story Points  
**Epic:** Code Quality & Maintainability  
**Date Created:** 2025-12-30  
**Status:** backlog

---

## Problem Statement

The web app has several custom components that duplicate or poorly implement functionality available in shadcn/ui:

- **`TimeRangeSelector`** - Custom button group that should be shadcn Tabs
- **Main Navigation** in `_protected._layout.tsx` - Custom navigation that should be shadcn Sidebar
- **`LiveIndicator`** refresh button - Custom button instead of shadcn Button
- **Missing accessibility features** - keyboard navigation, ARIA attributes
- **Inconsistent patterns** - Each custom component has its own styling approach
- **No mobile responsiveness** - Main navigation lacks mobile menu

This creates accessibility gaps, increases maintenance burden, and misses out on shadcn's built-in features.

---

## Key Findings

### 🔍 Component Replacement Opportunities

1. **`TimeRangeSelector`** → **shadcn Tabs**
   - **Issues**: Manual active state, no keyboard navigation, hardcoded styling
   - **Benefits**: Built-in keyboard navigation (arrow keys), ARIA attributes, theme-aware

2. **`_protected._layout.tsx` navigation** → **shadcn Sidebar**
   - **Issues**: No mobile menu, no active state management, not responsive
   - **Benefits**: Mobile-responsive collapsible sidebar, active state management, accessibility

3. **`LiveIndicator` refresh button** → **shadcn Button**
   - **Issues**: Custom styling, manual hover states
   - **Benefits**: Consistent icon button styling, proper disabled states, theme-aware

---

## Goals

1. **Replace custom components** with shadcn equivalents
2. **Improve accessibility** - WCAG 2.1 AA compliance
3. **Add mobile responsiveness** - Sidebar with mobile menu
4. **Reduce maintenance burden** - Leverage shadcn's maintained components
5. **Consistent patterns** - Follow shadcn composition patterns
6. **Better DX** - Use `pnpx shadcn@latest add` for component installation

---

## Acceptance Criteria

### AC1: TimeRangeSelector → shadcn Tabs

- [ ] Install shadcn Tabs component
- [ ] Replace `TimeRangeSelector` custom component with Tabs
- [ ] Maintain visual consistency with current design
- [ ] Keyboard navigation works (arrow keys)
- [ ] Update all usages in analytics components

### AC2: Main Navigation → shadcn Sidebar

- [ ] Install shadcn Sidebar, Avatar, and Sheet components
- [ ] Replace custom header navigation with Sidebar
- [ ] Implement mobile-responsive collapsible sidebar
- [ ] Add active route highlighting
- [ ] Update user avatar to use shadcn Avatar
- [ ] Test on mobile, tablet, and desktop

### AC3: LiveIndicator Button → shadcn Button

- [ ] Refactor refresh button to use shadcn Button with `variant="ghost"` and `size="icon"`
- [ ] Maintain spin animation on refresh
- [ ] Add screen reader text (`sr-only`)
- [ ] Test disabled state

### AC4: Documentation & Patterns

- [ ] Document component replacement patterns in CONTRIBUTING.md
- [ ] Update examples to use shadcn components
- [ ] Create decision guide: When to create custom vs use shadcn

---

## Implementation Plan

### Phase 1: TimeRangeSelector → Tabs

**Current Component** (`apps/web/src/features/analytics/time-range-selector.tsx`):

```tsx
// Custom button group with manual state management
<div className="inline-flex rounded-lg border border-border-subtle bg-surface-glass p-1">
  {TIME_RANGES.map((range) => (
    <Button
      key={range.value}
      variant={value === range.value ? "default" : "ghost"}
      size="sm"
      onClick={() => onChange(range.value)}
    >
      {range.label}
    </Button>
  ))}
</div>
```

**Replacement Steps:**

1. Install Tabs component:

   ```bash
   cd apps/web
   pnpx shadcn@latest add tabs
   ```

2. Create new implementation:

   ```tsx
   import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";

   interface TimeRangeSelectorProps {
     value: string;
     onChange: (value: string) => void;
   }

   export function TimeRangeSelector({
     value,
     onChange,
   }: TimeRangeSelectorProps) {
     return (
       <Tabs value={value} onValueChange={onChange}>
         <TabsList>
           <TabsTrigger value="1M">1M</TabsTrigger>
           <TabsTrigger value="3M">3M</TabsTrigger>
           <TabsTrigger value="6M">6M</TabsTrigger>
           <TabsTrigger value="1Y">1Y</TabsTrigger>
           <TabsTrigger value="ALL">ALL</TabsTrigger>
         </TabsList>
       </Tabs>
     );
   }
   ```

3. Update usages:
   - `apps/web/src/features/analytics/performance-chart.tsx`
   - `apps/web/src/features/analytics/performance-dashboard.tsx`

4. Test keyboard navigation (arrow keys, Home, End)

**Benefits:**

- Automatic keyboard navigation
- ARIA attributes for screen readers
- Theme-aware styling
- Less code to maintain

---

### Phase 2: Main Navigation → Sidebar

**Current Implementation** (`apps/web/src/routes/_protected._layout.tsx`):

```tsx
// Custom header navigation
<header className="border-b border-border bg-background/80 px-8 py-4 backdrop-blur-xl">
  <nav className="flex items-center gap-6 text-sm">
    <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
      Dashboard
    </Link>
    {/* More links... */}
  </nav>
</header>
<main><Outlet /></main>
```

**Replacement Steps:**

1. Install Sidebar and supporting components:

   ```bash
   cd apps/web
   pnpx shadcn@latest add sidebar
   pnpx shadcn@latest add avatar
   pnpx shadcn@latest add dropdown-menu  # For user menu
   ```

2. Create AppSidebar component:

   ```tsx
   // apps/web/src/components/app-sidebar.tsx
   import {
     Sidebar,
     SidebarContent,
     SidebarFooter,
     SidebarGroup,
     SidebarHeader,
     SidebarMenu,
     SidebarMenuButton,
     SidebarMenuItem,
   } from "@repo/ui/components/sidebar";
   import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
   import {
     LayoutDashboard,
     Briefcase,
     Settings,
     TrendingUp,
   } from "lucide-react";
   import { Link, useLocation } from "react-router";

   export function AppSidebar() {
     const location = useLocation();

     const menuItems = [
       { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
       { to: "/analytics", icon: TrendingUp, label: "Analytics" },
       { to: "/settings", icon: Settings, label: "Settings" },
     ];

     return (
       <Sidebar>
         <SidebarHeader>
           <div className="flex items-center gap-3 px-2">
             <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
               <Briefcase className="h-5 w-5 text-primary" />
             </div>
             <span className="font-serif text-xl font-light">FinSight</span>
           </div>
         </SidebarHeader>

         <SidebarContent>
           <SidebarGroup>
             <SidebarMenu>
               {menuItems.map((item) => (
                 <SidebarMenuItem key={item.to}>
                   <SidebarMenuButton
                     asChild
                     isActive={location.pathname.startsWith(item.to)}
                   >
                     <Link to={item.to}>
                       <item.icon className="h-4 w-4" />
                       <span>{item.label}</span>
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroup>
         </SidebarContent>

         <SidebarFooter>
           <SidebarMenu>
             <SidebarMenuItem>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <SidebarMenuButton>
                     <Avatar className="h-6 w-6">
                       <AvatarFallback className="text-xs">
                         {user.email[0].toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                     <span className="truncate">{user.email}</span>
                   </SidebarMenuButton>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent side="top" align="end">
                   <DropdownMenuItem asChild>
                     <Link to="/settings/profile">Profile</Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={handleSignOut}>
                     Sign Out
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </SidebarMenuItem>
           </SidebarMenu>
         </SidebarFooter>
       </Sidebar>
     );
   }
   ```

3. Update protected layout:

   ```tsx
   // apps/web/src/routes/_protected._layout.tsx
   import {
     SidebarProvider,
     SidebarTrigger,
   } from "@repo/ui/components/sidebar";
   import { AppSidebar } from "@/components/app-sidebar";

   export default function ProtectedLayout() {
     return (
       <SidebarProvider>
         <div className="flex h-screen w-full">
           <AppSidebar />
           <main className="flex-1 overflow-auto">
             {/* Mobile menu trigger */}
             <div className="sticky top-0 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
               <SidebarTrigger />
               <span className="font-serif text-lg font-light">FinSight</span>
             </div>

             {/* Page content */}
             <Outlet />
           </main>
         </div>
       </SidebarProvider>
     );
   }
   ```

4. Test responsive behavior:
   - Desktop: Sidebar visible by default
   - Mobile: Sidebar hidden, accessible via trigger button
   - Tablet: Test collapsible behavior

**Benefits:**

- Mobile-responsive out of the box
- Built-in active state management
- Proper semantic HTML structure
- Keyboard navigation (Tab, Enter, Escape)
- ARIA attributes for screen readers

---

### Phase 3: LiveIndicator Button → shadcn Button

**Current Implementation** (`apps/web/src/components/live-indicator.tsx`):

```tsx
// Custom button with manual styling
<button
  onClick={handleRefresh}
  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-overlay-light hover:border-border-medium hover:bg-overlay-medium"
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
</button>
```

**Replacement:**

```tsx
import { Button } from "@repo/ui/components/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

<Button
  variant="ghost"
  size="icon"
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="h-8 w-8"
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
  <span className="sr-only">Refresh prices</span>
</Button>;
```

**Changes:**

- Use shadcn Button with `variant="ghost"` and `size="icon"`
- Add screen reader text with `sr-only` class
- Leverage Button's built-in disabled state styling
- Maintain spin animation

---

### Phase 4: Documentation

**Update CONTRIBUTING.md:**

Add section on **Component Development Guidelines**:

```markdown
## Component Development Guidelines

### Using shadcn/ui Components

Before creating a custom component, check if shadcn/ui provides a suitable component:

1. **Browse available components**: https://ui.shadcn.com/docs/components
2. **Install with CLI**: `pnpx shadcn@latest add <component>`
3. **Compose, don't duplicate**: Extend shadcn components rather than recreating them

### When to Create Custom Components

Create custom components only when:

- No suitable shadcn component exists
- Domain-specific business logic required (e.g., PortfolioCard, HoldingsTable)
- Complex composition of multiple shadcn components (extract to reusable component)

### Decision Guide

| Need                     | Solution                                        |
| ------------------------ | ----------------------------------------------- |
| Tabs / Segmented Control | `pnpx shadcn@latest add tabs`                   |
| Navigation / Sidebar     | `pnpx shadcn@latest add sidebar`                |
| Buttons                  | `pnpx shadcn@latest add button`                 |
| Forms                    | `pnpx shadcn@latest add form`                   |
| Dialogs / Modals         | `pnpx shadcn@latest add dialog`                 |
| Dropdowns                | `pnpx shadcn@latest add dropdown-menu`          |
| Data Tables              | `pnpx shadcn@latest add table` + TanStack Table |

### Accessibility Requirements

All components must meet WCAG 2.1 AA standards:

- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen reader support (ARIA attributes, semantic HTML)
- Focus indicators
- Color contrast ratios
- Touch-friendly sizing (44x44px minimum)

shadcn/ui components provide these features out of the box.
```

---

## Impact Analysis

### Files Affected

**Components to Replace:**

- `apps/web/src/features/analytics/time-range-selector.tsx`
- `apps/web/src/routes/_protected._layout.tsx`
- `apps/web/src/components/live-indicator.tsx` (if exists)

**Components to Create:**

- `apps/web/src/components/app-sidebar.tsx` (new)

**Components to Update (usages):**

- `apps/web/src/features/analytics/performance-chart.tsx`
- `apps/web/src/features/analytics/performance-dashboard.tsx`

**Documentation:**

- `CONTRIBUTING.md`

### Benefits

1. **Accessibility**: WCAG 2.1 AA compliance out of the box
2. **Mobile Responsive**: Sidebar provides collapsible mobile navigation
3. **Maintainability**: Leverage shadcn's maintained components
4. **Developer Experience**: Clear patterns for future development
5. **Code Reduction**: Less custom code to maintain
6. **Consistency**: Unified component patterns across app
7. **Keyboard Navigation**: Built-in keyboard shortcuts
8. **Theme Integration**: Components automatically respect theme

### Risks

- **Visual changes**: Sidebar layout is different from header layout
- **Breaking changes**: Component API changes may affect usages
- **Learning curve**: Team needs to learn shadcn patterns

**Mitigation:**

- Incremental rollout (phase by phase)
- Thorough testing on mobile, tablet, desktop
- QA visual appearance at each phase
- Document migration patterns

---

## Testing Strategy

### Functional Testing

**TimeRangeSelector:**

- [ ] Clicking tabs changes selection
- [ ] Keyboard navigation with arrow keys
- [ ] Home/End keys jump to first/last tab
- [ ] Visual indicator shows active tab

**Sidebar:**

- [ ] Desktop: Sidebar visible by default
- [ ] Mobile: Sidebar hidden, accessible via trigger
- [ ] Mobile: Sidebar closes on navigation
- [ ] Active route highlighted correctly
- [ ] User menu dropdown works
- [ ] Sign out functionality works

**LiveIndicator:**

- [ ] Refresh button triggers refresh
- [ ] Spin animation shows during refresh
- [ ] Button disabled during refresh
- [ ] Screen reader announces button

### Accessibility Testing

- [ ] Keyboard-only navigation (Tab, Enter, Escape)
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] Color contrast meets WCAG AA

### Responsive Testing

- [ ] Mobile (< 640px): Sidebar collapsed, trigger visible
- [ ] Tablet (640-1024px): Test collapsible behavior
- [ ] Desktop (> 1024px): Sidebar expanded by default

### Visual Regression Testing

- [ ] Screenshot comparison before/after
- [ ] Theme switching works (light/dark)
- [ ] No layout shifts or overflow issues

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All phases completed
- [ ] Functional testing passed
- [ ] Accessibility testing passed (WCAG 2.1 AA)
- [ ] Responsive testing passed (mobile, tablet, desktop)
- [ ] Visual QA passed (no regressions)
- [ ] Documentation updated
- [ ] All tests passing
- [ ] PR reviewed and approved
- [ ] Changeset created

---

## Related Work

- **Depends on**: Tech Debt 2 (CSS Variables) - Semantic tokens needed
- **Blocks**: None
- **Related**: Tech Debt 3 (Layout Consistency) - Sidebar improves layout structure

---

## Notes

- **Estimated effort**: 5-8 points depending on Sidebar complexity
- **Can be split**: Each phase can be a separate mini-story if needed
- **High value for UX**: Mobile navigation is a significant improvement
- **Accessibility win**: WCAG 2.1 AA compliance improves inclusivity
- **Future-proof**: shadcn components are actively maintained
- **Desktop vs Mobile**: Sidebar fundamentally changes layout on mobile (improvement)
- **User avatar**: Include in Sidebar footer with dropdown menu
