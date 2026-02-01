---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/planning-artifacts/research/market-us-portfolio-tracking-multi-asset-research-2025-12-26.md"
  - "_bmad-output/planning-artifacts/research/market-vietnam-portfolio-tracking-research-2025-12-26.md"
workflowType: "ux-design"
lastStep: 15
project_name: "portfolios-tracker"
user_name: "Son"
date: "2026-01-15"
---

# UX Design Specification: portfolios-tracker

**Author:** Son  
**Date:** 2026-01-15  
**Version:** 2.0 (Updated with Marketing Redesign)

---

## Executive Summary

### Product Vision

Portfolios Tracker transforms cross-border portfolio tracking from fragmented anxiety into **consolidated calm**. Built for investors managing Vietnamese stocks, US equities, and cryptocurrency across multiple accounts, portfolios-tracker delivers institutional-grade analytics through a Unified Portfolio Dashboard with premium glassmorphism aesthetics and sophisticated micro-interactions.

The product bridges a critical gap: no existing platform offers unified VN + US + crypto tracking with transparent methodology and multi-currency fluency (VND/USD/USDT). By treating each asset class as a first-class citizen and exposing calculation lineage, portfolios-tracker positions as the "adult in the room" for tech-savvy investors who distrust black-box analytics.

**Core Differentiator:** The only tracker that makes cross-border Vietnamese wealth feel simple — pairing institutional data quality with a calming, polished interface designed to reduce volatility-driven overwhelm.

---

### Target Users

**Primary: Cross-Border Tech Professionals (Age 25-40)**

- Vietnamese working abroad or internationally-exposed locals
- Portfolio: VN stocks (30-40%) + US equities (30-40%) + Crypto (20-30%)
- Current behavior: Juggling 5+ apps (SSI iBoard, Schwab, Binance, TradingView, Excel)
- Pain: Manual reconciliation, no FX gain separation, fragmented mental model
- Success metric: "Finally, one place to see my whole picture without switching contexts"

**Secondary: Vietnamese Retail Investors (Age 25-45, Urban)**

- Middle-class Vietnamese managing 50M-500M VND portfolios across SSI/VPS/VCBS
- Behavior: 70% mobile trading, concentrated in VN30 blue chips
- Pain: No multi-brokerage aggregation, weak portfolio analytics beyond basic P&L
- Success metric: "I can track all my Vietnamese stocks in one view and compare with my crypto holdings"

**Tertiary: Small Investment Teams & Family Offices**

- Overseas Vietnamese managing family wealth, local investment clubs
- Need: Shared portfolios, audit trails, collaborative decision-making
- Pain: Single-user tools force workarounds, no roles/permissions
- Success metric: "Our family can track Grandma's VN stocks and Dad's US portfolio together"

---

## Design System Specification

### Visual Style: Dark Glassmorphism + Fintech Premium

Based on UI/UX Pro Max recommendations for Fintech/Crypto products:

| Element             | Specification                       | Rationale                            |
| ------------------- | ----------------------------------- | ------------------------------------ |
| **Primary Style**   | Glassmorphism + Dark Mode (OLED)    | Premium fintech feel, trust-building |
| **Secondary Style** | Motion-Driven + Micro-interactions  | Engagement without distraction       |
| **Landing Pattern** | Conversion-Optimized + Social Proof | Hero + Testimonials + CTA flow       |
| **Dashboard Style** | Real-Time Monitoring + Predictive   | Fintech standard                     |

### Typography System

**Font Pairing: Tech Startup** (from UI/UX Pro Max recommendations)

| Element               | Font              | Weight  | Usage                            |
| --------------------- | ----------------- | ------- | -------------------------------- |
| **Headings**          | Space Grotesk     | 400-700 | All headlines, titles, hero text |
| **Body**              | DM Sans           | 400-700 | Body text, labels, descriptions  |
| **Financial Numbers** | DM Sans (tabular) | 500-700 | Portfolio values, P&L, metrics   |
| **Code/Mono**         | JetBrains Mono    | 400     | Ticker symbols, technical data   |

**Google Fonts Import:**

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap");
```

**Tailwind Config:**

```css
--font-sans: "DM Sans", sans-serif;
--font-heading: "Space Grotesk", sans-serif;
--font-mono: JetBrains Mono, monospace;
```

### Color Palette

**Primary Palette: Fintech Dark Tech**

| Role           | Hex     | OKLCH                         | Usage                            |
| -------------- | ------- | ----------------------------- | -------------------------------- |
| **Primary**    | #10B981 | oklch(0.6487 0.1538 150.3071) | CTA buttons, positive indicators |
| **Secondary**  | #8B5CF6 | oklch(0.6746 0.1414 261.3380) | Secondary actions, accents       |
| **Accent**     | #06B6D4 | oklch(0.8269 0.1080 211.9627) | Highlights, gradients            |
| **Background** | #0F172A | oklch(0.2303 0.0125 264.2926) | Page background                  |
| **Surface**    | #1E293B | oklch(0.3210 0.0078 223.6661) | Card backgrounds                 |
| **Foreground** | #F8FAFC | oklch(0.9219 0 0)             | Primary text                     |
| **Muted**      | #94A3B8 | oklch(0.7155 0 0)             | Secondary text                   |
| **Border**     | #334155 | oklch(0.3867 0 0)             | Standard borders                 |

**Gradient System:**

| Gradient        | Colors                                               | Usage                          |
| --------------- | ---------------------------------------------------- | ------------------------------ |
| **Primary CTA** | from-emerald-500 to-cyan-500                         | Primary call-to-action buttons |
| **Secondary**   | from-purple-500 to-pink-500                          | Feature highlights             |
| **Accent**      | from-orange-500 to-amber-500                         | Crypto/DeFi indicators         |
| **Glow Effect** | from-emerald-500/20 via-cyan-500/20 to-purple-500/20 | Glass card glows               |

### Component Design Tokens

**Glass Morphism Effects:**

```css
/* Glass Card */
.glass-card {
  background: oklch(0.17 0.02 260 / 50%);
  backdrop-filter: blur(24px);
  border: 1px solid oklch(1 0 0 / 6%);
  border-radius: 1rem;
}

/* Glass Card Hover */
.glass-card:hover {
  border-color: oklch(1 0 0 / 12%);
  background: oklch(1 0 0 / 5%);
}
```

**Border Variants:**

- `border-subtle`: 6% white opacity - Resting state
- `border-medium`: 12% white opacity - Hover/focus state
- `border`: Standard shadcn border token

**Surface Elevation:**

- `surface`: Base surface (card level)
- `surface-elevated`: Hover/active state
- `surface-glass`: Semi-transparent glass effect

---

## Navigation Architecture

### Marketing Pages (Public)

**Floating Pill Navigation:**

| Feature        | Specification                          |
| -------------- | -------------------------------------- |
| **Position**   | Fixed, top-4 left-4 right-4 (floating) |
| **Style**      | Rounded-full, glassmorphism            |
| **Background** | Transparent → black/60 on scroll       |
| **Height**     | 56px (desktop), 48px (mobile)          |
| **Mobile**     | Hamburger menu with slide-down panel   |

**Page Structure:**

1. Hero Section (animated counters, gradient orbs)
2. Features Section (bento grid layout)
3. Testimonials Section (card carousel)
4. Pricing Section (3-tier toggle)
5. CTA Section (animated gradient box)
6. Footer (newsletter signup, link grid)

### Application Pages (Authenticated)

**Unified Dashboard Navigation:**

```
Dashboard (Portfolio List)
├── Portfolio Detail (/portfolio/:id)
│   ├── Holdings Table (unified, filterable)
│   ├── Performance Chart
│   └── Allocation Donut
├── Asset Detail (/portfolio/:id/asset/:symbol)
│   ├── TradingView Chart
│   └── Transaction History
└── Settings
    └── Connections (API management)
```

---

## Screen Specifications

### 1. Marketing Home (`/`)

**Hero Section:**

- Floating pill navigation (glassmorphism)
- Animated gradient orbs background
- Space Grotesk heading: "Your wealth, one dashboard"
- Gradient text animation for tagline
- Dual CTA buttons (primary gradient, outline)
- Animated stat counters ($250M+ tracked, 50K+ users, 12.4% avg returns)
- Dashboard mockup with floating decorative elements

**Features Section:**

- Section badge with icon
- Bento grid layout (1 large + 7 normal cards)
- Gradient icon backgrounds per feature
- Hover glow effects
- Arrow indicators on hover

**Testimonials Section:**

- Quote icon with hover color change
- Star ratings
- Gradient avatar backgrounds with glow
- Company logos social proof

**Pricing Section:**

- Monthly/Yearly toggle with 25% savings badge
- 3-tier cards (Free/Pro/Enterprise)
- Popular badge on Pro tier
- Feature checklists with emerald checkmarks

**CTA Section:**

- Full-width animated gradient background
- Floating badge ("Join 50,000+ investors")
- Dual CTA buttons (solid white, outline)
- Trust indicators

**Footer:**

- Newsletter signup with email icon
- 4-column link grid
- Social icons (Twitter, GitHub, LinkedIn, Discord)
- Copyright with year

### 2. Dashboard (`/dashboard`)

**Portfolio Cards Grid:**

- 12-column grid (4 cols per card on large screens)
- Card content: name, net worth, P/L, mini donut
- Hover: surface-elevated effect
- Click: navigate to portfolio detail

### 3. Portfolio Detail (`/portfolio/:id`)

**Layout:**

- Portfolio header (name, total value, P/L badge)
- Time-series chart (1D/1W/1M/YTD/ALL toggles)
- Allocation donut chart
- Unified holdings table with asset-class filters

**Holdings Table:**

- Filter bar: [All] [VN] [US] [Crypto]
- Columns: Asset, Type (badge), Price, 24h %, Value, P/L
- Info icons for methodology hover cards
- Virtualized for performance

### 4. Asset Detail (`/portfolio/:id/asset/:symbol`)

**Content:**

- TradingView chart embed
- Transaction history table
- Realized/Unrealized P/L cards
- FX gain separation (where applicable)

---

## Motion & Animation Specification

### Transition Standards

| Animation Type | Duration    | Easing   | Usage                         |
| -------------- | ----------- | -------- | ----------------------------- |
| **Micro**      | 150ms       | ease-out | Hover states, button feedback |
| **Standard**   | 200-300ms   | ease-out | Component transitions         |
| **Page**       | 400-600ms   | ease-out | Page/section reveals          |
| **Stagger**    | 100ms delay | -        | List item reveals             |

### Framer Motion Patterns

**Fade + Slide Up:**

```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

**Staggered Children:**

```tsx
variants={containerVariants}
initial="hidden"
whileInView="visible"
viewport={{ once: true }}
transition={{ staggerChildren: 0.1 }}
```

**Background Animation:**

```tsx
animate={{
  scale: [1, 1.1, 1],
  opacity: [0.3, 0.4, 0.3],
}}
transition={{
  duration: 8,
  repeat: Infinity,
  ease: "easeInOut",
}}
```

### Reduced Motion Support

All animations must respect `prefers-reduced-motion`:

```tsx
const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
/>;
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

| Requirement             | Specification                                     |
| ----------------------- | ------------------------------------------------- |
| **Color Contrast**      | 4.5:1 minimum for normal text, 3:1 for large text |
| **Focus Indicators**    | Visible ring using `ring-emerald-500/50`          |
| **Keyboard Navigation** | All interactive elements accessible               |
| **ARIA Labels**         | Meaningful labels for screen readers              |
| **Error Announcements** | Use `role="alert"` for error messages             |
| **Alt Text**            | Descriptive alt for all meaningful images         |

### Interactive Element Requirements

- All clickable elements: `cursor-pointer`
- Touch targets: ≥44px minimum
- Focus visible: Ring indicator on keyboard focus
- Hover feedback: Color/shadow transitions (150-300ms)

---

## Responsive Breakpoints

| Breakpoint | Width       | Navigation              | Grid Columns |
| ---------- | ----------- | ----------------------- | ------------ |
| **sm**     | ≤640px      | Bottom tab bar (mobile) | 1 column     |
| **md**     | 641-1024px  | Scrollable tabs         | 2 columns    |
| **lg**     | 1025-1440px | Standard tabs           | 3-4 columns  |
| **xl**     | ≥1441px     | Full navigation         | 4+ columns   |

---

## Implementation Checklist

### Marketing Pages (Completed ✅)

- [x] Floating pill navigation with glassmorphism
- [x] Hero section with animated counters
- [x] Bento grid features section
- [x] Testimonials with avatar glow
- [x] 3-tier pricing with toggle
- [x] Animated CTA section
- [x] Newsletter footer

### Dashboard Pages (To Implement)

- [ ] Portfolio cards with surface-elevated hover
- [ ] Unified holdings table with filters
- [ ] Performance chart with time controls
- [ ] Asset detail with TradingView
- [ ] Connection management cards

### Design System

- [x] Typography (Space Grotesk + DM Sans)
- [x] Glass morphism utilities
- [x] Surface elevation tokens
- [x] Gradient system
- [x] Animation tokens
- [ ] Dark/light mode toggle (dashboard only)

---

## Deliverables

1. **Design Tokens** - CSS variables in globals.css ✅
2. **Typography** - Google Fonts import + Tailwind config ✅
3. **Component Specs** - Marketing components implemented ✅
4. **Motion Tokens** - Framer Motion patterns documented ✅
5. **Accessibility Checklist** - WCAG 2.1 AA standards ✅
6. **Dashboard Specs** - Outlined, pending implementation

---

## References

- **UI/UX Pro Max** - Design intelligence database
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
