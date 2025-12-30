# Style Guide - Fin-Sight UI System

> **Design System**: Tailwind v4 + CSS Variables + shadcn/ui components  
> **Last Updated**: 2025-12-30

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Layout System](#layout-system)
4. [Spacing & Sizing](#spacing--sizing)
5. [Component Utilities](#component-utilities)
6. [Component Patterns](#component-patterns)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Motion & Animation](#motion--animation)
10. [Data Visualization](#data-visualization)
11. [Migration Guide](#migration-guide)
12. [Best Practices](#best-practices)
13. [Tailwind v4 Notes](#tailwind-v4-notes)

---

## Color System

### Philosophy

We use **semantic color tokens** defined as CSS variables in `globals.css`. This provides:

- Single source of truth for colors
- Automatic light/dark mode adaptation
- Maintainable theming
- Clear intent through naming

### Token Categories

#### Base Tokens (shadcn/ui)

These are inherited from shadcn/ui and should be your first choice:

| Token              | Usage               | Example                 |
| ------------------ | ------------------- | ----------------------- |
| `background`       | Page background     | `bg-background`         |
| `foreground`       | Primary text        | `text-foreground`       |
| `card`             | Card backgrounds    | `bg-card`               |
| `card-foreground`  | Card text           | `text-card-foreground`  |
| `muted`            | Subtle backgrounds  | `bg-muted`              |
| `muted-foreground` | Secondary text      | `text-muted-foreground` |
| `border`           | Standard borders    | `border-border`         |
| `input`            | Input backgrounds   | `bg-input`              |
| `primary`          | Primary actions     | `bg-primary`            |
| `destructive`      | Destructive actions | `bg-destructive`        |

#### Extended Surface Tokens

For advanced UI patterns (glassmorphism, elevated surfaces):

| Token              | Usage                                         | Tailwind Class        |
| ------------------ | --------------------------------------------- | --------------------- |
| `surface`          | Standard surface (slightly lighter than card) | `bg-surface`          |
| `surface-elevated` | Elevated surface (hover states)               | `bg-surface-elevated` |
| `surface-glass`    | Semi-transparent glass effect                 | `bg-surface-glass`    |

**Dark Mode Values:**

```css
--surface: oklch(0.17 0.02 260); /* Slightly lighter than card */
--surface-elevated: oklch(0.2 0.02 260); /* Even lighter for elevation */
--surface-glass: oklch(0.17 0.02 260 / 50%); /* Semi-transparent */
```

#### Extended Border Tokens

| Token           | Usage                                 | Tailwind Class         |
| --------------- | ------------------------------------- | ---------------------- |
| `border-subtle` | Very subtle borders (6% opacity)      | `border-border-subtle` |
| `border-medium` | Medium emphasis borders (12% opacity) | `border-border-medium` |

#### Extended Overlay Tokens

| Token            | Usage                       | Tailwind Class      |
| ---------------- | --------------------------- | ------------------- |
| `overlay-light`  | Light overlay (3% opacity)  | `bg-overlay-light`  |
| `overlay-medium` | Medium overlay (5% opacity) | `bg-overlay-medium` |

---

## Typography

### Font System

We use system font stack for optimal performance and native appearance:

```css
/* packages/ui/src/styles/globals.css */
body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}
```

### Type Scale

Based on Tailwind's default scale, mapped to semantic usage:

| Element    | Class       | Size            | Weight          | Line Height | Usage                  |
| ---------- | ----------- | --------------- | --------------- | ----------- | ---------------------- |
| Hero       | `text-6xl`  | 3.75rem (60px)  | `font-bold`     | 1           | Landing page headlines |
| H1         | `text-5xl`  | 3rem (48px)     | `font-bold`     | 1           | Page titles            |
| H2         | `text-4xl`  | 2.25rem (36px)  | `font-semibold` | 1.2         | Section headers        |
| H3         | `text-3xl`  | 1.875rem (30px) | `font-semibold` | 1.2         | Subsection headers     |
| H4         | `text-2xl`  | 1.5rem (24px)   | `font-semibold` | 1.33        | Card titles            |
| H5         | `text-xl`   | 1.25rem (20px)  | `font-medium`   | 1.4         | Small headings         |
| Body Large | `text-lg`   | 1.125rem (18px) | `font-normal`   | 1.55        | Important body text    |
| Body       | `text-base` | 1rem (16px)     | `font-normal`   | 1.5         | Default body text      |
| Body Small | `text-sm`   | 0.875rem (14px) | `font-normal`   | 1.43        | Secondary text, labels |
| Caption    | `text-xs`   | 0.75rem (12px)  | `font-normal`   | 1.33        | Metadata, timestamps   |

### Financial Display Font

For displaying financial data (portfolio values, P&L):

```tsx
// Use font-serif for elegant number display
<div className="font-serif text-3xl font-light tracking-tight text-foreground">
  $65,450.00
</div>
```

### Usage Examples

```tsx
// Page Title
<h1 className="text-5xl font-bold text-foreground">Dashboard</h1>

// Section Header
<h2 className="text-4xl font-semibold text-foreground mb-6">Your Portfolios</h2>

// Card Title
<CardTitle className="text-2xl font-semibold">Personal Wealth</CardTitle>

// Body Text
<p className="text-base text-muted-foreground">Your portfolio summary</p>

// Label/Caption
<span className="text-xs text-muted-foreground">Last updated 5 min ago</span>

// Financial Value (serif for elegance)
<div className="font-serif text-3xl font-light tracking-tight">
  $10,500.00
</div>
```

---

## Layout System

### Container Widths

We use Tailwind's responsive container with custom max-widths:

```tsx
// Full-width page container
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>

// Constrained content width (for readability)
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Dashboard content */}
</div>

// Narrow content (forms, articles)
<div className="mx-auto max-w-2xl px-4">
  {/* Auth forms */}
</div>
```

### Container Pattern Decision Matrix

Choose the appropriate container pattern based on your page type:

| Page Type          | Max Width    | Padding Pattern             | Use Case                                  | Example Pages                  |
| ------------------ | ------------ | --------------------------- | ----------------------------------------- | ------------------------------ |
| **Dashboard/List** | `max-w-7xl`  | `px-4 sm:px-6 lg:px-8 py-6` | Primary content with cards, tables, grids | Dashboard, Portfolio List      |
| **Settings/Forms** | `max-w-2xl`  | `px-4 sm:px-6 lg:px-8 py-6` | Narrow focused content                    | Settings, Login, Sign Up       |
| **Detail Pages**   | `max-w-7xl`  | `px-4 sm:px-6 lg:px-8 py-6` | Asset details, portfolio details          | Asset Detail, Portfolio Detail |
| **Full-Width**     | No max-width | `px-4 sm:px-6 lg:px-8 py-0` | Charts, data visualizations (rare)        | Data Viz Pages                 |

**Implementation Examples:**

```tsx
// ✅ Primary Content Pages (Dashboard, Portfolio List)
export default function Dashboard() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Portfolios
          </h1>
          <Button variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New Portfolio
          </Button>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {portfolios.map((p) => (
            <div key={p.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
              <PortfolioCard portfolio={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ✅ Settings/Form Pages (Narrow Content)
export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-light text-foreground sm:text-3xl mb-2">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your preferences
          </p>
        </div>
        {/* Settings cards */}
      </div>
    </div>
  );
}

// ✅ Connections Page (Full-Width with Container)
export default function ConnectionsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Exchange Connections
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your crypto exchange accounts
          </p>
        </div>
        {/* Connection cards */}
      </div>
    </div>
  );
}
```

### Breakpoints

Tailwind v4 default breakpoints (mobile-first):

| Breakpoint | Min Width | Usage                                 |
| ---------- | --------- | ------------------------------------- |
| `sm`       | 640px     | Small tablets, large phones landscape |
| `md`       | 768px     | Tablets                               |
| `lg`       | 1024px    | Laptops, small desktops               |
| `xl`       | 1280px    | Large desktops                        |
| `2xl`      | 1536px    | Extra large screens                   |

### Grid Layouts

**12-Column Grid System:**

All complex layouts should use a 12-column grid base for consistency and predictability:

```tsx
// ✅ Responsive card grid using 12-column base
<div className="grid grid-cols-12 gap-6">
  {portfolios.map((p) => (
    <div key={p.id} className="col-span-12 sm:col-span-6 lg:col-span-4">
      <PortfolioCard portfolio={p} />
    </div>
  ))}
</div>

// ✅ Sidebar + content split (3 + 9 columns)
<div className="grid grid-cols-12 gap-8">
  {/* Sidebar */}
  <aside className="col-span-12 lg:col-span-3">
    <Nav />
  </aside>

  {/* Main content */}
  <main className="col-span-12 lg:col-span-9">
    <Outlet />
  </main>
</div>

// ✅ Dashboard metrics (3 equal columns = 4 cols each)
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 md:col-span-4">
    <MetricCard title="Total Value" value="$65,450" />
  </div>
  <div className="col-span-12 md:col-span-4">
    <MetricCard title="Total Gain" value="+$3,450" />
  </div>
  <div className="col-span-12 md:col-span-4">
    <MetricCard title="Return" value="+5.5%" />
  </div>
</div>

// ❌ Don't use arbitrary column counts
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Use 12-column system instead */}
</div>
```

**Standard Gap Values:**

- Cards/items: `gap-6` (1.5rem / 24px)
- Sections: `gap-8` (2rem / 32px)
- Tight spacing: `gap-4` (1rem / 16px)

**Dashboard 2-column layout:**

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
  {/* Main content: 8 columns on large screens */}
  <div className="lg:col-span-8">
    <PerformanceChart />
  </div>

  {/* Sidebar: 4 columns on large screens */}
  <div className="lg:col-span-4">
    <AssetAllocation />
  </div>
</div>
```

**Holdings table with metrics:**

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  <MetricCard title="Total Value" value="$65,450" />
  <MetricCard title="Total Gain" value="+$3,450" />
  <MetricCard title="Return" value="+5.5%" />
</div>
```

### Flex Layouts

```tsx
// Horizontal stack with spacing
<div className="flex items-center gap-2">
  <Icon />
  <span>Label</span>
</div>

// Justified toolbar
<div className="flex items-center justify-between">
  <h2>Holdings</h2>
  <Button>Add Transaction</Button>
</div>

// Vertical stack
<div className="flex flex-col gap-4">
  <Card />
  <Card />
</div>

// ✅ Responsive header with full-width button on mobile
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
    Portfolios
  </h1>
  <Button variant="outline" className="w-full sm:w-auto">
    <Plus className="mr-2 h-4 w-4" /> New Portfolio
  </Button>
</div>
```

### Layout vs Grid vs Flex Decision Matrix

Choose the right layout approach:

| Pattern            | Use When                                                            | Example                                                   |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| **12-Column Grid** | Complex layouts with multiple items, card grids, dashboard sections | Portfolio cards, metrics panels, sidebar + content        |
| **Flex**           | Simple linear arrangements, toolbars, headers, small groups         | Header with title + button, icon + label, vertical stacks |
| **Container**      | Page-level structure, max-width constraints                         | All page wrappers (`max-w-7xl`, `max-w-2xl`)              |

**Rule of thumb:**

- Single-axis alignment → Flex
- Multi-item grid → 12-column Grid
- Page structure → Container

---

## Spacing & Sizing

### Spacing Scale

Use Tailwind's spacing scale consistently:

| Class             | Size          | Usage                              |
| ----------------- | ------------- | ---------------------------------- |
| `gap-1` / `p-1`   | 0.25rem (4px) | Tight spacing (icon + text)        |
| `gap-2` / `p-2`   | 0.5rem (8px)  | Compact spacing                    |
| `gap-4` / `p-4`   | 1rem (16px)   | Default spacing (cards, sections)  |
| `gap-6` / `p-6`   | 1.5rem (24px) | Comfortable spacing (card padding) |
| `gap-8` / `p-8`   | 2rem (32px)   | Section spacing                    |
| `gap-12` / `p-12` | 3rem (48px)   | Major section dividers             |

### Common Patterns

```tsx
// Card padding
<Card className="p-6">
  <CardHeader className="space-y-1.5">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>

// Section spacing
<section className="py-12">
  <div className="space-y-8">
    {/* Sections within */}
  </div>
</section>

// Form field spacing
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Email</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Password</Label>
    <Input type="password" />
  </div>
</div>
```

---

## Component Utilities

Pre-built utility classes for common patterns:

### Glass Morphism

```tsx
// Basic glass card
<div className="glass-card">
  {/* Glass effect with backdrop-blur */}
</div>

// Glass card with hover effect
<div className="glass-card-hover">
  {/* Includes transitions */}
</div>
```

**CSS Definition:**

```css
.glass-card {
  @apply rounded-2xl border border-border-subtle bg-surface-glass backdrop-blur-xl shadow-lg;
}

.glass-card-hover {
  @apply glass-card transition-all duration-300 hover:border-border hover:bg-overlay-medium;
}
```

### Surface Patterns

```tsx
// Primary surface
<Card className="surface-primary">

// Elevated surface
<Card className="surface-elevated">

// Elevated with hover effect
<Card className="surface-elevated-hover">
```

**CSS Definitions:**

```css
.surface-primary {
  @apply bg-surface border-border;
}

.surface-elevated {
  @apply bg-surface-elevated border-border shadow-md;
}

.surface-elevated-hover {
  @apply surface-elevated transition-all hover:shadow-lg hover:border-border-medium;
}
```

### Skeleton Loading

```tsx
<Skeleton className="skeleton-surface" />
```

**CSS Definition:**

```css
.skeleton-surface {
  @apply animate-pulse bg-muted/50;
}
```

---

## Component Patterns

### Using shadcn/ui Components

**Always start with shadcn base components** rather than creating custom alternatives:

```bash
# Add components as needed
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add dialog
pnpx shadcn@latest add input
pnpx shadcn@latest add select
pnpx shadcn@latest add table
```

### Extending shadcn Components

Extend base components using composition, not duplication:

```tsx
// ✅ Good: Extend Button with composition
import { Button } from "@repo/ui/components/button";

export function IconButton({ icon: Icon, ...props }) {
  return (
    <Button size="icon" variant="ghost" {...props}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// ❌ Bad: Duplicate button implementation
export function IconButton() {
  return <button className="...">...</button>;
}
```

### Card Patterns

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@repo/ui/components/card";

// Portfolio Summary Card
<Card className="surface-elevated-hover">
  <CardHeader>
    <CardTitle className="text-base text-muted-foreground">
      Personal Wealth
    </CardTitle>
    <CardDescription>Last updated 5 min ago</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="font-serif text-3xl font-light">$65,450</div>
    <div className="text-sm text-emerald-500">+$3,450 (+5.5%)</div>
  </CardContent>
  <CardFooter className="justify-between">
    <span className="text-xs text-muted-foreground">VND Portfolio</span>
    <Button variant="ghost" size="sm">
      View
    </Button>
  </CardFooter>
</Card>;
```

### Form Patterns

```tsx
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Button } from '@repo/ui/components/button';

// Form field with label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="border-border-subtle bg-overlay-light"
  />
</div>

// Input with icon
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Email" />
</div>

// Search input
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    className="pl-10"
    placeholder="Search assets..."
    type="search"
  />
</div>
```

### Dialog/Modal Patterns

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/dialog";

// Modal with form
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogDescription>
        Enter transaction details for your portfolio
      </DialogDescription>
    </DialogHeader>
    <form className="space-y-4">{/* Form fields */}</form>
  </DialogContent>
</Dialog>;
```

### Table Patterns

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@repo/ui/components/table";

// Holdings table
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Asset</TableHead>
      <TableHead className="text-right">Quantity</TableHead>
      <TableHead className="text-right">Value</TableHead>
      <TableHead className="text-right">P/L</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {holdings.map((h) => (
      <TableRow key={h.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{h.symbol}</TableCell>
        <TableCell className="text-right">{h.quantity}</TableCell>
        <TableCell className="text-right">{formatCurrency(h.value)}</TableCell>
        <TableCell className="text-right">
          <span className={h.pnl > 0 ? "text-emerald-500" : "text-red-500"}>
            {formatCurrency(h.pnl)}
          </span>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>;
```

### Badge Patterns

```tsx
import { Badge } from '@repo/ui/components/badge';

// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Expired</Badge>

// Asset type badges
<Badge variant="outline" className="border-blue-500/50 text-blue-500">
  US Equity
</Badge>
<Badge variant="outline" className="border-amber-500/50 text-amber-500">
  Crypto
</Badge>
```

### Skeleton Loading Patterns

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

// Loading card
<Card className="surface-primary animate-pulse">
  <CardHeader>
    <Skeleton className="h-4 w-32 skeleton-surface" />
    <Skeleton className="h-3 w-24 skeleton-surface" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-48 skeleton-surface mb-2" />
    <Skeleton className="h-4 w-32 skeleton-surface" />
  </CardContent>
</Card>

// Loading table rows
<TableRow>
  <TableCell><Skeleton className="h-4 w-16 skeleton-surface" /></TableCell>
  <TableCell><Skeleton className="h-4 w-20 skeleton-surface" /></TableCell>
  <TableCell><Skeleton className="h-4 w-24 skeleton-surface" /></TableCell>
</TableRow>
```

---

## Responsive Design

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile-first
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <h1 className="text-2xl md:text-4xl">Dashboard</h1>
  <Button className="w-full md:w-auto">Add Portfolio</Button>
</div>

// ❌ Bad: Desktop-first (requires overrides)
<div className="hidden md:flex lg:grid">
```

### Responsive Patterns

```tsx
// Responsive grid (1 → 2 → 3 columns)
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive text size
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="lg:hidden">

// Responsive flex direction
<div className="flex flex-col lg:flex-row">
```

### Touch-Friendly Design

Ensure interactive elements are touch-friendly (minimum 44x44px):

```tsx
// Button sizes
<Button size="sm">Small</Button>        // 32px height
<Button size="default">Default</Button>  // 36px height
<Button size="lg">Large</Button>        // 40px height

// Icon buttons (already 44x44px minimum)
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>

// Touch-friendly table rows
<TableRow className="hover:bg-muted/50 cursor-pointer min-h-[44px]">
```

---

## Accessibility

### WCAG 2.1 AA Compliance

Our design system meets WCAG 2.1 AA standards:

- **Color contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Focus indicators**: Visible focus rings on all focusable elements
- **ARIA labels**: Meaningful labels for screen readers

### Keyboard Navigation

```tsx
// Focus rings are already styled globally
* {
  @apply outline-ring/50;
}

// Button groups with arrow key navigation
<div role="group" aria-label="Asset filters">
  <Button>All</Button>
  <Button>VN</Button>
  <Button>US</Button>
</div>

// Skip to content link
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
  Skip to content
</a>
```

### ARIA Patterns

````tsx
### Official Documentation
- [Tailwind v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Framer Motion](https://www.framer.com/motion/)
- [OKLCH Color Space](https://oklch.com/)

### Project Files
- Color System: `/packages/ui/src/styles/globals.css`
- Components: `/packages/ui/src/components/`
- Architecture: `/_bmad-output/architecture.md`

### Adding New Components

Always use shadcn CLI to add new components:

```bash
# Available components
pnpx shadcn@latest add

# Add specific component
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add dialog
pnpx shadcn@latest add form
pnpx shadcn@latest add table
pnpx shadcn@latest add tabs
pnpx shadcn@latest add select
pnpx shadcn@latest add popover
pnpx shadcn@latest add dropdown-menu
pnpx shadcn@latest add badge
pnpx shadcn@latest add skeleton
pnpx shadcn@latest add progress
pnpx shadcn@latest add toast
````

Components will be added to `/packages/ui/src/components/` and automatically use our theme tokens.

---

## Quick Reference

### Common Component Combinations

```tsx
// Dashboard card with header and action
<Card className="surface-elevated-hover">
  <CardHeader className="flex flex-row items-center justify-between">
    <div>
      <CardTitle>Portfolio Name</CardTitle>
      <CardDescription>Last updated 5m ago</CardDescription>
    </div>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </CardHeader>
  <CardContent>
    <div className="font-serif text-3xl font-light">$65,450</div>
  </CardContent>
</Card>

// Form with validation
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      type="email"
      className="border-border-subtle bg-overlay-light"
    />
    <p className="text-sm text-destructive">Error message</p>
  </div>
  <Button type="submit" className="w-full">Submit</Button>
</form>

// Data table with actions
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Asset</TableHead>
      <TableHead className="text-right">Value</TableHead>
      <TableHead className="w-[100px]">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">AAPL</TableCell>
      <TableCell className="text-right font-mono">$15,000</TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">Edit</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## Questions?

For questions about styling:

1. **Check this guide first** - Most patterns are documented
2. **Check shadcn/ui docs** - For component-specific patterns
3. **Look at existing components** - See how others implemented it
4. **Check `globals.css`** - For available tokens and utilities
5. **Ask in team chat** - For architecture decisions

---

## Contributing to the Style Guide

Found a missing pattern or have improvements?

1. Create examples in a feature branch
2. Document the pattern with code examples
3. Add "before/after" comparisons if replacing old patterns
4. Update this guide with the new pattern
5. Create PR with `docs:` prefix

---

**Remember**:

- ✅ **Always use shadcn components** - Don't recreate what exists
- ✅ **Extend, don't duplicate** - Compose shadcn components
- ✅ **Use semantic tokens** - No hardcoded colors
- ✅ **Mobile-first** - Design for small screens first
- ✅ **Accessibility** - WCAG 2.1 AA compliance
- ✅ **Consistency** - Follow established patterns

🎨 Happy building!

</Dialog>

// Icon with label for screen readers
<Button aria-label="Close dialog">
<X className="h-4 w-4" />
<span className="sr-only">Close</span>
</Button>

````

### Color Contrast

Our semantic tokens ensure proper contrast:

```tsx
// ✅ Good: Uses semantic tokens with proper contrast
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
</div>

// ✅ Good: Error states with sufficient contrast
<span className="text-destructive">Error message</span>

// ❌ Bad: Low contrast custom colors
<div className="bg-zinc-900 text-zinc-800"> // Fails WCAG
````

### Focus Management

```tsx
// Auto-focus first input in modal
import { useEffect, useRef } from "react";

function AddTransactionDialog() {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstInputRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent>
        <Input ref={firstInputRef} />
      </DialogContent>
    </Dialog>
  );
}

// Return focus after dialog closes (Dialog component handles this)
```

---

## Motion & Animation

### Framer Motion Integration

We use Framer Motion for smooth animations:

```tsx
import { motion } from 'framer-motion';

// Fade in on mount
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>

// Slide up animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  <Card />
</motion.div>

// Staggered children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <PortfolioCard {...item} />
    </motion.div>
  ))}
</motion.div>
```

### Reduced Motion Support

Respect user's motion preferences:

```tsx
import { useReducedMotion } from "framer-motion";

function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
      }}
    >
      <Card />
    </motion.div>
  );
}
```

### CSS Transitions

For simple transitions, use Tailwind utilities:

```tsx
// Hover effects
<Button className="transition-all hover:scale-105">
  Click me
</Button>

// Color transitions
<div className="bg-background transition-colors hover:bg-muted">

// Transform transitions
<div className="transition-transform hover:-translate-y-1">
```

---

## Data Visualization

### Chart Patterns

```tsx
// TradingView widget (primary)
import { TradingViewWidget } from "@/components/trading-view-widget";

<div className="rounded-xl border border-border-subtle bg-surface p-0 shadow-xl h-[500px]">
  <TradingViewWidget symbol={ticker} />
</div>;

// Recharts fallback
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="date" stroke="var(--muted-foreground)" />
    <YAxis stroke="var(--muted-foreground)" />
    <Tooltip
      contentStyle={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
      }}
    />
    <Line
      type="monotone"
      dataKey="value"
      stroke="var(--primary)"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>;
```

### Table Patterns for Financial Data

```tsx
// Right-align numbers, use monospace font
<TableCell className="text-right font-mono">
  {formatNumber(value)}
</TableCell>

// Color-coded P/L
<TableCell className="text-right">
  <span className={cn(
    "font-mono",
    pnl >= 0 ? "text-emerald-500" : "text-red-500"
  )}>
    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
  </span>
</TableCell>

// Percentage with badge
<TableCell className="text-right">
  <Badge variant={change >= 0 ? "default" : "destructive"}>
    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
  </Badge>
</TableCell>
```

### Progress & Allocation Indicators

```tsx
import { Progress } from '@repo/ui/components/progress';

// Asset allocation bar
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>US Equities</span>
    <span className="text-muted-foreground">45%</span>
  </div>
  <Progress value={45} className="h-2" />
</div>

// Multi-segment allocation
<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
  <div className="bg-blue-500" style={{ width: '40%' }} />
  <div className="bg-emerald-500" style={{ width: '35%' }} />
  <div className="bg-amber-500" style={{ width: '25%' }} />
</div>
```

---

## Migration Guide

### Common Replacements

#### Backgrounds

| ❌ Hardcoded      | ✅ Semantic Token   | Usage            |
| ----------------- | ------------------- | ---------------- |
| `bg-zinc-900`     | `bg-surface`        | Standard surface |
| `bg-zinc-900/50`  | `bg-surface-glass`  | Semi-transparent |
| `bg-zinc-950`     | `bg-background`     | Page background  |
| `bg-white/[0.03]` | `bg-overlay-light`  | Light overlay    |
| `bg-white/[0.05]` | `bg-overlay-medium` | Medium overlay   |

#### Borders

| ❌ Hardcoded          | ✅ Semantic Token      | Usage              |
| --------------------- | ---------------------- | ------------------ |
| `border-zinc-800`     | `border-border`        | Standard borders   |
| `border-zinc-700`     | `border-border-medium` | Hover borders      |
| `border-white/6`      | `border-border-subtle` | Subtle borders     |
| `border-white/[0.08]` | `border-border-subtle` | Alternative subtle |
| `border-white/12`     | `border-border-medium` | Medium borders     |

#### Text

| ❌ Hardcoded    | ✅ Semantic Token       | Usage            |
| --------------- | ----------------------- | ---------------- |
| `text-white`    | `text-foreground`       | Primary text     |
| `text-zinc-400` | `text-muted-foreground` | Secondary text   |
| `text-zinc-500` | `text-muted-foreground` | Muted text       |
| `text-zinc-600` | `text-muted-foreground` | Placeholder text |

### Before & After Examples

#### Example 1: Portfolio Card

**Before:**

```tsx
<Card className="h-full bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all">
  <CardHeader>
    <CardTitle className="text-sm font-medium text-zinc-400">
      Portfolio Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-white">$10,000</div>
  </CardContent>
</Card>
```

**After:**

```tsx
<Card className="h-full surface-elevated-hover">
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Portfolio Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-foreground">$10,000</div>
  </CardContent>
</Card>
```

#### Example 2: Glass Card

**Before:**

```tsx
<div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/[0.15] hover:bg-white/[0.05]">
  {children}
</div>
```

**After:**

```tsx
<div className="glass-card-hover shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
  {children}
</div>
```

#### Example 3: Auth Form Input

**Before:**

```tsx
<Input
  className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-zinc-900/50 focus:border-emerald-500/50"
  placeholder="Email"
/>
```

**After:**

```tsx
<Input
  className="pl-10 h-11 border-border-subtle bg-overlay-light text-foreground placeholder:text-muted-foreground focus:bg-surface-glass focus:border-primary/50"
  placeholder="Email"
/>
```

### Decision Tree

```
Need styling?
├─ Is it a standard UI element (text, background, border)?
│  └─ Use base tokens (foreground, background, border, muted-foreground)
│
├─ Is it a surface/card?
│  ├─ Standard card → bg-card or bg-surface
│  ├─ Elevated/hover → surface-elevated-hover utility
│  └─ Glass effect → glass-card or glass-card-hover utility
│
├─ Is it a border?
│  ├─ Standard → border-border
│  ├─ Subtle → border-border-subtle
│  └─ Emphasized → border-border-medium
│
└─ Is it an overlay?
   ├─ Light → bg-overlay-light
   └─ Medium → bg-overlay-medium
```

---

## Best Practices

### ✅ Do

- **Use semantic tokens**: `text-foreground`, not `text-white`
- **Use utilities**: `glass-card`, not custom inline styles
- **Check shadcn tokens first**: Before reaching for extended tokens
- **Consider theme modes**: Tokens work in light/dark automatically
- **Use component composition**: Combine utilities for complex effects

```tsx
// Good
<Card className="surface-elevated-hover">
  <CardTitle className="text-muted-foreground">Title</CardTitle>
</Card>

// Also good - combining utilities
<div className="glass-card p-6 space-y-4">
  <h2 className="text-foreground font-bold">Heading</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

### ❌ Don't

- **No hardcoded colors**: Never use `bg-zinc-900`, `text-white`, etc.
- **No opacity math**: Don't use `bg-white/[0.08]`
- **No arbitrary values for colors**: Use defined tokens
- **No inline hex/rgb**: No `bg-[#1a1a1a]`

```tsx
// Bad
<Card className="bg-zinc-900 border-zinc-800 text-white">
  <p className="text-zinc-400">Text</p>
</Card>

// Bad
<div className="bg-white/[0.08] border-white/[0.15]">
  Content
</div>
```

### Adding New Color Needs

If you need a color that doesn't exist:

1. **First**: Check if existing tokens can be reused
2. **Second**: Check if you can compose existing tokens
3. **Third**: Propose new semantic token in `globals.css`

**Adding a new token:**

```css
/* packages/ui/src/styles/globals.css */

@theme inline {
  /* Add to theme config */
  --color-surface-interactive: var(--surface-interactive);
}

:root {
  --surface-interactive: oklch(0.95 0 0); /* Light mode */
}

.dark {
  --surface-interactive: oklch(0.22 0.02 260); /* Dark mode */
}
```

Then use: `bg-surface-interactive`

---

## Tailwind v4 Notes

### CSS-Based Configuration

Tailwind v4 uses CSS for configuration instead of `tailwind.config.js`:

```css
/* All configuration in CSS */
@theme inline {
  --color-brand: var(--primary);
  --radius-card: 1rem;
}
```

### Exposing CSS Variables

To make CSS variables available as Tailwind classes:

```css
@theme inline {
  --color-surface: var(--surface);
}
```

Now you can use: `bg-surface`

### Custom Variants

```css
@custom-variant dark (&:is(.dark *));
```

This creates the `.dark` variant used throughout the app.

### No Config File Needed

- ❌ `tailwind.config.js` - Not used in v4
- ✅ `globals.css` - All config here
- ✅ `@theme inline` - Expose variables
- ✅ `@layer components` - Custom utilities

---

## Component Examples

### Glassmorphism Card

```tsx
import { GlassCard } from "@/components/glass-card";

<GlassCard hover onClick={() => console.log("clicked")}>
  <div className="p-6">
    <h3 className="text-foreground font-semibold">Title</h3>
    <p className="text-muted-foreground">Description</p>
  </div>
</GlassCard>;
```

### Elevated Surface Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@repo/ui/components/card";

<Card className="surface-elevated-hover">
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Your content here</p>
  </CardContent>
</Card>;
```

### Loading Skeleton

```tsx
import { Skeleton } from "@repo/ui/components/skeleton";

<Card className="surface-primary animate-pulse">
  <CardHeader>
    <Skeleton className="h-4 w-32 skeleton-surface" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-8 w-48 skeleton-surface mb-2" />
    <Skeleton className="h-4 w-64 skeleton-surface" />
  </CardContent>
</Card>;
```

---

## Resources

- [Tailwind v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [OKLCH Color Space](https://oklch.com/)
- Project: `/packages/ui/src/styles/globals.css`

---

## Questions?

For questions about styling:

1. Check this guide first
2. Look at existing components for patterns
3. Check `globals.css` for available tokens
4. Ask in team chat or create a discussion

---

**Remember**: Consistency is key! Using semantic tokens makes the entire app easier to maintain and theme. 🎨
