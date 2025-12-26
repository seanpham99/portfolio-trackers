---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/project-planning-artifacts/research/market-us-portfolio-tracking-multi-asset-research-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/market-vietnam-portfolio-tracking-research-2025-12-26.md"
workflowType: "ux-design"
lastStep: 14
project_name: "fin-sight"
user_name: "Son"
date: "2025-12-26"
---

# UX Design Specification: fin-sight

**Author:** Son  
**Date:** 2025-12-26  
**Version:** 1.0 (Complete)

---

## Executive Summary

### Product Vision

Fin-sight transforms cross-border portfolio tracking from fragmented anxiety into **consolidated calm**. Built for investors managing Vietnamese stocks, US equities, and cryptocurrency across multiple accounts, fin-sight delivers institutional-grade analytics through an Enhanced Tabbed Navigation interface with premium micro-interactions that encourages exploration during market volatility instead of panic-driven exits.

The product bridges a critical gap: no existing platform offers unified VN + US + crypto tracking with transparent methodology and multi-currency fluency (VND/USD/USDT). By treating each asset class as a first-class citizen and exposing calculation lineage, fin-sight positions as the "adult in the room" for tech-savvy investors who distrust black-box analytics.

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

### Key Design Challenges

**1. Navigation Pattern: Safety vs Innovation**

- **Challenge:** Balance proven usability (tabs) with differentiation (premium feel)
- **Solution:** Enhanced Tabbed Navigation with smooth micro-interactions (200ms transitions, animated indicators, keyboard shortcuts)
- **Research basis:** Nielsen Norman Group data shows horizontal scrolling causes negative user reactions; tabs "just work"

**2. Calm-Under-Volatility Experience Design**

- **Goal:** 2+ minute sessions during VN down-days (≤-1.5% VN-Index) with 1.4× tab-switching
- **Balance:** Information density + emotional design to reduce panic, encourage exploration
- **Color psychology:** Red/green gains/losses without triggering stress; staleness badges without anxiety

**3. Multi-Asset Cognitive Switching**

- **Context:** Users toggle between VN stocks (VND, T+2, 9-3pm ICT) ↔ US (USD, instant, 9:30-4pm EST) ↔ Crypto (USDT, 24/7)
- **Challenge:** Each asset class has distinct mental models (settlement, hours, volatility)
- **Solution:** Clear tab labels with badges (count + value), unobtrusive currency conversions, timezone cues

**4. Rapid Drill-Down Navigation (≤3 Clicks)**

- **Requirement:** Net Worth → Portfolio → Asset → Transaction in ≤3 clicks
- **Mobile constraint:** Touch targets ≥44px, limited screen real estate
- **Architecture:** Tab-based switching + information hierarchy that supports speed without losing breadcrumb context

**5. Crypto API Integration (95% Success Rate)**

- **Scope change:** Replaced CSV import with Crypto API integration (Binance + OKX)
- **Challenge:** OAuth flow, real-time sync, connection management, error recovery
- **Target:** ≥98% successful connection rate; 5-second sync; clear disconnect/reconnect flows

---

### Design Opportunities

**1. Enhanced Tabs as Premium Differentiator**

- Opportunity to elevate standard tabs with fin-sight's "design moment"
- Smooth transitions (fade + 30px slide), animated underline, keyboard shortcuts (Cmd+1/2/3/4)
- Mobile: Swipe gestures feel native; Desktop: Arrow key navigation
- **Differentiation through polish, not novelty**

**2. Transparent Methodology as Trust Builder**

- Inline "show methodology" panels (collapsible) differentiate from black-box competitors
- Progressive disclosure: Beginners see summary, experts drill formulas
- Builds educational trust: "This is how we calculate your cost basis (FIFO), here's the FX rate source"

**3. Cross-Border Narrative & Multi-Currency Storytelling**

- FX gain separation tells richer story: "Assets +8%, but VND weakened -2% vs USD"
- Visual language: Flags, currency symbols, timezone badges as wayfinding
- Positions as "built for overseas Vietnamese managing wealth across borders"

**4. Freemium Conversion at Natural Friction**

- Upgrade prompts at "20 asset limit" feel earned, not intrusive
- Modal messaging around outcomes: "Track your full wealth without limits; see precise insights"
- A/B test opportunity: Features vs outcomes, VND (SePay) vs USD (Polar) payment UX

**5. Mobile-First for Vietnamese Market (70% Mobile Trading)**

- Bottom tab bar on mobile (≤640px) optimized for thumb reach
- Horizontal scrollable tabs on tablet (641-1024px)
- Push notification opportunity: "VN-Index down 2%, your US holdings offset -0.5%"

---

## Strategic Decisions

### Navigation Pattern: Enhanced Tabbed Navigation

**Decision Date:** 2025-12-26  
**Decision:** Adopt Enhanced Tabbed Navigation as primary pattern for v1.0

**Rationale:**

Based on Nielsen Norman Group usability research and resource constraints (zero budget, tight timeline), the team unanimously recommends **Enhanced Tabbed Navigation** as the primary pattern for v1.0:

**Why Tabs Win:**

- ✅ **Proven usability**: NN/G research shows tabs "just work" — users understand them immediately
- ✅ **Zero learning curve**: No onboarding needed, accessible by default (keyboard, screen readers)
- ✅ **Fast to implement**: Standard React components + Framer Motion animations = 1-2 weeks dev
- ✅ **Mobile-proven**: Horizontal scrollable tabs + bottom tab bars are industry standard
- ✅ **Safety-first**: Achieves same goal (multi-asset switching) without discovery risk

**Why Not Spatial Stage Slider (Deferred to Phase 2+):**

- ❌ **Horizontal scrolling risks**: NN/G data shows users consistently dislike horizontal scrolling on desktop
- ❌ **Discovery problems**: Even strong visual cues (arrows) are often ignored; weak information scent
- ❌ **No budget for validation**: Spatial slider requires dedicated UX research ($750 + 2 weeks) to de-risk
- ❌ **Innovation for innovation's sake**: Differentiation through polish > novelty

**Enhanced Tab Features:**

1. **Smooth transitions**: Fade content (200ms) + subtle 30px slide — feels premium without usability cost
2. **Tab badges**: Each tab shows `VN Stocks (12 • ₫450M)` — instant context
3. **Keyboard shortcuts**: `Cmd+1/2/3/4` for power users, arrow keys for navigation
4. **Animated underline**: Indicator slides smoothly between tabs (not jarring instant switch)
5. **Mobile swipe**: Touch gesture support on mobile only (familiar, low risk)

**Future Exploration:**

- **Phase 2**: Split-pane compare mode at XL breakpoints (≥1441px) — side-by-side VN vs US comparison
- **Phase 3**: Spatial Stage Slider as experimental feature pending dedicated UX budget and A/B testing

---

### Scope Change: CSV Import → Crypto API Integration

**Decision Date:** 2025-12-26  
**Decision:** Remove CSV Import from MVP; Add Crypto API Integration (Binance + OKX)

**Rationale:**

**Why Remove CSV Import:**

1. **High Failure Risk** - Vietnamese investor forums (cophieu68) report 30-40% CSV import failures due to inconsistent broker formats (SSI/VPS/VCBS)
2. **Maintenance Burden** - 3 weeks dev effort for parsing, validation, error mapping; ongoing support as broker formats change
3. **False Convenience** - Users expect "easy import" but hit format errors, blame the app, churn
4. **No Broker APIs** - VN brokers (SSI/VPS/VCBS) offer zero retail APIs; US brokers require expensive Plaid aggregation ($0.30+/user/month)

**Why Add Crypto API Integration:**

1. **Market Differentiation** - Competitors (Delta, CoinStats) don't focus on Vietnamese market with crypto sync
2. **Technical Simplicity** - CCXT library provides unified interface to 100+ exchanges; Binance + OKX = 4 days dev vs 3 weeks for CSV
3. **Real-Time Sync** - Automatic balance updates every 60s; no user error from outdated exports
4. **Magic Moment** - "Whoa, it synced all my Binance holdings instantly!" creates immediate value perception
5. **User Segment Fit** - 30% of Vietnamese tech investors are crypto-heavy; this serves them perfectly

**Impact on Activation:**

- Time-to-first-portfolio: 10 min → 15 min (acceptable for early adopters)
- Crypto users: Get instant sync (competitive advantage)
- Stock users: Manual entry with enhanced UX (autocomplete, keyboard shortcuts)
- Net timeline: Ship 2.5 weeks earlier

**Team Consensus:**

- **PM (John):** Strategic pivot reduces risk, faster launch, clearer value prop
- **Architect (Winston):** Massively simpler implementation; CCXT handles complexity
- **Analyst (Mary):** User research shows manual entry acceptable if app is good; CSV failures kill trust
- **UX Designer (Sally):** Crypto API = magic moment; manual entry = predictable; CSV = broken promises

**Phase 2 Consideration:**

- CSV Import moves to experimental beta if manual entry becomes #1 churn driver
- Monitor activation metrics for 3 months before committing resources

---

## UX Principles

- Clarity-first: Prioritize legibility, hierarchy, and minimalism during volatility.
- Predictability: Favor familiar patterns; reduce surprises with progressive disclosure.
- Calm motion: Short, subtle transitions; respect `prefers-reduced-motion`.
- Trust through transparency: Show methodology, data freshness, and calculation lineage.
- Speed to value: ≤ 3 clicks to drill; ≤ 15 minutes to first complete portfolio.

## Information Architecture

- Global structure: Dashboard (tabbed VN/US/Crypto) → Portfolio → Asset → Transaction.
- Navigation: Top tabs on desktop/tablet; bottom tab bar on mobile; settings and connections in a dedicated area.
- Content hierarchy: Summary cards first, drill-down details second; charts defer mounting until visible.

## Core Screens

### Dashboard (Home)

- Enhanced Tabbed Navigation with badges: `VN Stocks (count • value)`, `US Equities`, `Crypto`.
- Summary metrics: Net worth, allocations by asset class, top movers, freshness badge.
- Quick actions: Add transaction, connect exchange, create portfolio.

### Portfolio Detail

- Holdings table with virtualization; filters (asset class, sector, account).
- Allocation donut, performance sparklines, methodology toggle.
- Staleness indicators; polling status; export actions.

### Asset Detail

- TradingView chart embed (RSI/MACD/MA); interval controls; reduced motion fallback.
- Lots and transactions list; realized/unrealized PnL; FX gain separation where applicable.
- Data source disclosure and last refresh timestamps.

### Transactions

- Manual entry form with autocomplete (symbols, recent assets); keyboard shortcuts; fee support.
- Batch add mode (Phase 2); validation with actionable hints.

### Settings → Connections

- Connect Binance/OKX via OAuth; status, last sync, error states with clear recovery.
- Read-only permission messaging; disconnect/reconnect flows; rate-limit handling.

## Component Strategy

- Tabs: Animated underline; arrow-key navigation; badges for count/value; swipe on mobile.
- Cards: Net worth, allocations, freshness; consistent elevation; skeleton loading states.
- Tables/Lists: Virtualized for performance; sticky headers; responsive columns.
- Charts: TradingView components lazy-loaded; accessibility labels; reduced motion.
- Forms: Autocomplete, keyboard shortcuts (`Cmd+1/2/3/4` for tabs; `Enter` to submit); inline validation.
- Status: Staleness badge (color-neutral), sync badge, error toasts with specific cause.

## Motion & Micro-Interactions

- Defaults: 200ms fade + 30px slide for tab transitions; easing: standard cubic-bezier.
- Reduced motion: Disable slide; retain minimal fade; skip chart animations.
- Feedback: Subtle success checkmarks; non-blocking toasts; focus management on form submit.

## Accessibility

- WCAG 2.1 AA; color contrast ≥ 4.5:1; keyboard navigable tabs and forms.
- ARIA roles/labels for tabs, charts, tables; screen-reader friendly status messages for staleness/sync.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Responsive Behavior

- Breakpoints: sm ≤ 640px (bottom tab bar), md 641–1024px (scrollable tabs), lg 1025–1440px (standard tabs), xl ≥ 1441px (optional split-view compare in Phase 2).
- Touch targets ≥ 44px; sticky headers; thumb-friendly controls.
- Avoid horizontal overflow; content stacks gracefully on smaller viewports.

## Design System

- Colors: Calm neutrals; measured reds/greens; status colors for staleness (neutral amber).
- Typography: Clean sans-serif; clear typographic scale; numeric tabular lining for financial figures.
- Grid/Spacing: 8px base; consistent rhythm; predictable density.
- Elevation: Minimal; reserved for interactive surfaces.

## User Journeys (Key Flows)

- Signup → Activation: Coachmarks guide to add assets and connect exchanges; ≤ 15 minutes to complete.
- Daily Check-In: Down-day path highlights offsetting gains; dwell ≥ 2 minutes; 1.4× tab switching.
- Crypto Sync: OAuth connect; balances within 5 seconds; 60s background refresh; clear error recovery.
- Upgrade Flow: Trigger at 20-asset limit; outcome-focused modal; dual currency providers (SePay/Polar).

## Instrumentation & Metrics

- Client events: Tab changes, dwell time, refresh clicks, form submits.
- Freshness tracking: Time since last price update; banner display rate.
- Conversion: Limit-hit prompts, payment success, recon retries.
- Accessibility audits: Automated checks in CI; quarterly manual reviews.

## Edge Cases & Recovery States

- Price staleness > 5 minutes: Banner + retry; exponential backoff; manual refresh.
- API failures: Clear cause labels (expired key, rate limit); reconnect CTA.
- Payment failures: Persisted state; retriable workflow; no partial upgrades.
- Import deferred: CSV import flagged as experimental (Phase 2) if needed.

## Acceptance Criteria (UX)

- Drill-down ≤ 3 clicks; export ≤ 2 seconds.
- Crypto connect success ≥ 98%; balances within 5 seconds; polling cadence ≈ 60s.
- Calm proxy on down days: session ≥ 2 minutes; tab switches ≥ 1.4× baseline.
- Accessibility: Keyboard navigation, screen-reader labels, reduced motion respected.

## Deliverables

- Wireframes for core screens (dashboard, portfolio, asset, transactions, connections).
- Component specs (tabs, tables, cards, badges, charts, forms).
- Motion tokens and accessibility checklist.
- Instrumentation plan mapped to success metrics.
