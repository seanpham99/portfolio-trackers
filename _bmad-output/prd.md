---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments:
  - "_bmad-output/project-planning-artifacts/research/market-vietnam-portfolio-tracking-research-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/vietnam-stock-market-mechanics-research-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/market-us-portfolio-tracking-multi-asset-research-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/domain-asset-specific-knowledge-research-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/domain-portfolio-calculations-analytics-2025-12-26.md"
  - "_bmad-output/project-planning-artifacts/research/domain-market-microstructure-2025-12-26.md"
  - "docs/index.md"
  - "_bmad-output/archive/2025-12-26/PRD.md"
documentCounts:
  briefs: 0
  research: 6
  brainstorming: 0
  projectDocs: 2
workflowType: "prd"
lastStep: 11
project_name: "fin-sight"
user_name: "Son"
date: "2025-12-26"
---

# Product Requirements Document - fin-sight

**Author:** Son
**Date:** 2025-12-26

## Executive Summary

Fin-Sight is a multi-asset portfolio intelligence platform that unifies Vietnamese stocks, US equities, and cryptocurrency tracking with institutional-grade technical analysis and transparent analytics. Built for investors managing wealth across borders, Fin-Sight delivers professional-quality insights through an elegant, minimalist interface designed to reduce cognitive load during market volatility.

This PRD defines the first production version (v1.0) — a public launch ready for hundreds of users — extending the existing Airflow + ClickHouse data pipeline with a complete user-facing application and freemium monetization.

### Product Vision

**Problem Statement**

Investors managing multi-asset portfolios across Vietnamese and global markets face fragmentation:

- Vietnamese investors track VN stocks in SSI/VPS apps, US stocks in separate platforms, and crypto in exchanges — with no unified view.
- Generic portfolio trackers lack Vietnamese stock data and technical indicators.
- Spreadsheet tracking is error-prone, time-consuming, and doesn’t scale.
- No platform offers transparent calculation methodology for cost basis, performance, and risk metrics.
- Cross-border wealth (VND/USD/USDT) requires manual currency conversion and reconciliation.

**Solution**

Fin-Sight transforms an existing institutional-grade data pipeline (Apache Airflow + ClickHouse) into an interactive web application that:

1. Unifies Multi-Asset Tracking — Vietnamese stocks (HSX/HNX via vnstock), US equities (yfinance/Polygon.io), and cryptocurrency (CoinGecko/Binance) in a single portfolio view.
2. Delivers Professional Analytics — Technical indicators (RSI, MACD, MA) from TradingView and 3rd-party providers, with advanced charting via TradingView widgets; fallback to internal calculation when external data is absent.
3. Provides Transparent Calculations — Drill down from net worth → portfolio → asset → transaction with clear formulas for cost basis, returns, and allocations.
4. Handles Multi-Currency Fluency — Seamless USD/VND/USDT conversion with accurate FX rates, separating asset gains from currency gains.
5. Offers AI-Enhanced Insights — Leverages existing Gemini API integration for personalized portfolio analysis and market commentary.

### What Makes This Special

**Differentiator:** The only tracker that makes cross‑border Vietnamese wealth feel simple — pairing institutional data quality with a calming, polished interface designed to reduce volatility‑driven overwhelm.

**Unique Differentiators**

1. Vietnamese Market Excellence — Deep HSX/HNX integration via vnstock, understanding T+2 settlement and foreign ownership mechanics.
2. Multi-Asset Parity — VN stocks, US equities, and crypto treated as first-class citizens with equal feature depth.
3. Institutional Data + Consumer UX — Professional-grade technical indicators from TradingView/3rd-party providers wrapped in a minimalist, premium interface with smooth micro-interactions.
4. Transparent Methodology — Every metric (cost basis, returns, allocations) shows underlying formulas and data sources.
5. Cross-Border Intelligence — Built for overseas Vietnamese and tech-savvy investors managing VN + US + crypto with automatic multi-currency reconciliation.

## Project Classification

**Technical Type:** Web Application (SaaS B2C)
**Domain:** Fintech — Portfolio Management & Analytics
**Complexity Level:** High
**Project Context:** Brownfield (Airflow/ClickHouse foundation) with Greenfield frontend and Supabase backend

**Complexity Drivers**

- Multi-Asset Data Normalization — Different price formats, trading hours (HSX 9:00–15:00 ICT vs NYSE 9:30–16:00 EST), settlement cycles (T+2 VN/US vs 24/7 crypto).
- Multi-Currency Accounting — Cost basis in native currencies (VND/USD/USDT) with FX conversion; separation of asset vs currency gains.
- Financial Accuracy Requirements — Bulletproof portfolio calculations (FIFO/LIFO/Avg), dividend tracking, split adjustments.
- Performance at Scale — Hundreds of users polling portfolios with potentially thousands of assets; smart caching (Redis) and optimized queries (ClickHouse materialized views).
- Data Integration Complexity — TradingView, vnstock, yfinance, CoinGecko; different rate limits, formats, reliability.

## Architecture Overview

**Brownfield Extensions**

- New Airflow DAGs: market_data_us_equities, market_data_crypto, market_data_commodities.
- ClickHouse expansion: market_type enum, exchange rates table, latest-price materialized views.
- 3rd‑party indicator ingestion first; fallback pipeline calculations when external data is missing.

**Greenfield Components**

- React 19 web app with TradingView widgets (enhanced tabbed navigation with smooth transitions).
- NestJS API (authentication, business logic, caching, payments).
- Supabase (PostgreSQL) for users, portfolios, transactions.
- Redis for hot data caching; polling-based refresh (30–60s).

**Indicators & Refresh Strategy**

- Source: TradingView/Polygon/yfinance/vnstock ingested to ClickHouse; compute via Airflow only when external data absent.
- Strategy: Polling (no WebSockets in v1.0); frontend polls API; API serves from Redis → ClickHouse.

## Data Warehouse (Star Schema from Day One)

**Facts**

- Fact_Trades — per trade execution.
- Fact_Holdings_Daily — per account+asset per day.
- Fact_Portfolio_Valuation_Daily — per portfolio per day.

**Dimensions**

- Dim_Date — calendar hierarchies.
- Dim_Asset — SCD Type 2 (symbol/contract changes), asset_type, exchange, sector, currency.
- Dim_Account — user portfolio/brokerage/wallet.
- Dim_Platform — exchange/platform.

**Rationale**
Dimensional modeling + ClickHouse columnar storage yields fast analytics, clean drill‑down lineage, and future‑proof complexity handling.

## Freemium & Payments

**Free Tier**

- 1 portfolio, up to 20 assets, manual entry, basic net worth, delayed data.

**Paid Tier ($9–12/mo)**

- Unlimited portfolios/assets, CSV import, faster polling, AI insights, multi‑currency conversion, advanced charts.

**Providers**

- SePay (VND for Vietnam), Polar (USD global). Dual setup aligns with cross‑border user base.

## Launch Goals (6 Months)

- Active Users: 500 MAU; WAU/MAU ≥ 40%.
- Revenue: 50 paying users, ≈ $3K MRR proof point.
- Data Quality: Accurate net worth and allocations with drill‑down to transactions; FX handling separating asset vs currency gains.

## Success Criteria

### User Success

- **Portfolio-First Navigation:** Dashboard displays a list of portfolio cards; clicking a portfolio drills into that portfolio's unified holdings view with asset-class filtering. Navigation flow: **Dashboard (portfolio list) → Portfolio Detail (holdings) → Asset Detail (transactions)**; ≤ 3 clicks to drill from dashboard → portfolio → asset → transaction.
- Consolidated multi‑asset view within each portfolio across VN stocks, US equities, and crypto.
- Time‑to‑first‑complete‑portfolio ≤ 15 minutes (from signup to consolidated view via manual entry).
- Add transactions quickly: manual entry ≤ 30 seconds per transaction with autocomplete and keyboard shortcuts.
- Crypto API sync: ≥ 98% successful connection rate for Binance and OKX; real-time balance sync within 5 seconds.
- Volatility calm proxy: On VN down days (VN‑Index ≤ −1.5%), session duration ≥ 2 minutes; asset-class tab switches increase ≥ 1.4× baseline.
- Activation within 7 days: user adds ≥ 10 assets manually OR syncs ≥ 1 crypto exchange account.

### Business Success

- 3 months: 200 MAU, ≥ 5% paid conversion, ≈ $1K MRR.
- 6 months: 500 MAU, ≥ 10% paid conversion, ≈ $3K MRR.
- WAU/MAU ≥ 40%; D30 retention ≥ 30% for activated cohorts.
- Funnel: Signup → Activation ≥ 50%; Activation → Paid ≥ 15% (limit‑hit cohorts), ≥ 5% (non‑limit cohorts).

### Technical Success

- Correctness: Net worth, allocations, and returns within ±0.5%; FX gain separated from asset gain where applicable.
- Quality targets: See Non‑Functional Requirements for performance, reliability, caching, security, and data lineage baselines.

### Measurable Outcomes

- Drill‑down navigability ≤ 3 clicks; export CSV for audit within ≤ 2 seconds.
- Error feedback for CSV validation within ≤ 2 seconds with mapping hints to fix.
- Price freshness flagged when data staleness exceeds 5 minutes.

## Product Scope

Consolidated in Project Scoping & Phased Development. See that section for MVP (Phase 1), Growth (Phase 2), and Vision (Phase 3).

## User Journeys

### Signup → Activation (Primary Vietnamese Tech Investor)

- Signs up via Google OAuth; lands on dashboard with tabbed asset class navigation and "Get started" coachmark.
- Creates portfolio "VN + Crypto"; adds 10 VN stocks manually using autocomplete (symbol search returns HPG, VCB, FPT instantly).
- Connects Binance account via OAuth; 5 crypto holdings sync automatically within 5 seconds; real-time balance updates.
- Outcome: Activation completed within 7 days; time‑to‑first‑complete‑portfolio ≤ 15 minutes; drill‑down ≤ 3 clicks.
- Upgrade prompt: Hit 20‑asset free limit → modal offers unlock benefits (unlimited assets + faster polling + AI insights).

### Daily Check‑In (Calm‑Under‑Volatility)

- VN‑Index down −2%; dashboard shows VN tab first; user switches to Crypto tab → sees offset gain.
- Allocation panel shows top movers; price freshness badge warns if > 5 minutes; polling refresh 60 seconds.
- Outcome: Session duration ≥ 2 minutes on down days; tab switches ≥ 1.4× baseline; exploration instead of bounce.

### Crypto Exchange Sync (Binance, OKX)

- User navigates to Settings → Connected Accounts; clicks "Connect Binance".
- OAuth flow opens Binance login; user authorizes read-only access (view balances, no trading).
- Fin-sight receives API credentials; fetches all spot balances via CCXT library within 5 seconds.
- Balances appear in Crypto tab with real-time sync badge; background refresh every 60s.
- Outcome: Zero manual entry for crypto holdings; automatic updates; disconnect anytime in settings.

### Upgrade Flow (Freemium → Paid)

- User hits: “Add more than 20 assets” or “Enable CSV import”.
- Modal explains outcomes (“Track your full wealth without limits; precise insights”); choose currency (VND via SePay, USD via Polar).
- Payment processed; webhook idempotency with retries; dashboard reflects tier change; failure shows retriable state.
- Outcome: Conversion; payment success ≥ 98%; reconciliation nightly; cohort tracked for funnel metrics.

### Cross‑Border Portfolio (Overseas Vietnamese)

- Adds US equities (AAPL, MSFT) and VN holdings; FX rates apply; net worth shows USD base with FX gain breakdown.
- Drill‑down shows transaction lots and separate asset vs currency gain.
- Outcome: Correctness ±0.5%; FX breakdown visible; export CSV in ≤ 2 seconds.

### Recovery Journeys

- Price Staleness: If data > 5 minutes old, show banner and retry; user can refresh; system backoff handles provider outages.
- Payment Failure: Polar/SePay error → “Try again” with persisted state; background retries; user remains in free tier until success; no partial upgrades.
- API Connection Failure: Binance/OKX auth fails → "Reconnect" button; clear error message ("API key expired" vs "Rate limit exceeded"); retry with exponential backoff.

### Admin/Backoffice (System)

- Webhook reconciliation job aggregates Polar/SePay events; flags inconsistencies; admin dashboard shows retry queue; idempotent keys prevent duplicates.
- Outcome: Clean payment ledger; operational resilience.

## Domain-Specific Requirements

### Fintech Compliance & Regulatory Overview

Fin‑Sight v1.0 operates as a subscription portfolio tracker (no custody, no order routing, no broker‑dealer activity). It provides analytics and insights without financial advice. Payments are handled via SePay (VND) and Polar (USD), with webhook‑driven tier changes. Privacy alignment follows PDPA (Vietnam) and GDPR (EU): consent, minimization, rights management, and secure processing. Cross‑border data transfers use provider DPAs and appropriate safeguards. Card data is never stored or processed directly, reducing PCI DSS scope to transport security and integration integrity.

### Key Domain Concerns

- Regional compliance: PDPA/GDPR alignment; lawful bases (contract/consent); cross‑border transfer safeguards.
- Security standards: TLS, HSTS, CSP, OAuth (Supabase), RBAC/RLS, secret rotation, encrypted storage, backups, observability.
- Audit requirements: Append‑only event logs for portfolio mutations, payments, and webhooks; versioned calculation methodology (`calculation_version`); export trails.
- Fraud prevention: Webhook signature verification, replay protection, idempotency keys, anomaly detection on tier changes, rate limiting, brute‑force and credential stuffing defenses.
- Data protection: PII inventory, minimization, retention schedule, right‑to‑erasure flows, secure backups/restores, access governance.

### Compliance Requirements

- Disclaimers: Not financial advice; not a broker‑dealer; analytics only.
- Consent and preferences: Cookie/analytics consent surfaces; privacy policy and ToS reflect lawful basis and processing purposes.
- Data subject rights: Discoverability for export, deletion, correction; identity verification; erasure with legal carve‑outs for financial records as applicable.
- Provider agreements: DPAs with SePay/Polar and other data providers; document cross‑border safeguards.
- Breach response: Incident playbook, severity classification, user notification timelines per jurisdiction.

### Industry Standards & Best Practices

- OWASP ASVS control alignment; secure SDLC gates (threat modeling, dependency scanning, secrets scanning).
- Web security headers: HSTS, CSP, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy.
- Payments integrity: Signature verification, time‑window checks, nonces, idempotent processing, reconciliation dashboards.
- Operations: Backups, restores, infrastructure as code, monitoring/alerting, runbooks for staleness and provider outages.

### Required Expertise & Validation

- Legal/compliance review of PDPA/GDPR mappings and cross‑border transfers.
- Security architecture review; penetration testing focus on auth, webhooks, and admin tooling.
- Payment provider integration review (SePay/Polar), webhook idempotency and reconciliation validation.
- DPIA‑lite exercise for analytics and payment processing; logging auditability checks.

### Implementation Considerations

- Scope guardrails: No KYC/AML in v1.0; revisit only if Open Banking or custody/trading integrations are introduced.
- Data modeling for audit: SCD2 `Dim_Asset`; facts plus append‑only event logs; materialized views with lineage.
- Resilience pathways: Staleness detection, retries (exponential backoff), partial failure containment, graceful degradation.
- Admin tools: Reconciliation dashboard for payments/webhooks; audit log export; access governance with least privilege.

### Compliance Matrix

- Consent → Frontend modal + backend registry → Owner: PM/Frontend → Verification: e2e tests and audit export.
- Data minimization → Limit PII fields to essentials → Owner: Backend → Verification: schema reviews.
- Rights management → Export/Delete/Correct flows → Owner: Backend/Support → Verification: playbook runs.
- Cross‑border safeguards → DPA + SCCs/equivalents → Owner: Legal/PM → Verification: documented agreements.
- Breach notification → Incident playbook + timelines → Owner: DevOps/PM → Verification: tabletop exercises.

### Security Architecture

- AuthN/AuthZ: Supabase OAuth/JWT; RBAC/RLS for data access; least privilege for services.
- Transport/headers: TLS everywhere; HSTS; CSP; modern TLS ciphers.
- Secrets: Managed storage, rotation, encrypted at rest; access logging.
- Webhooks: Signature verification, replay guards (nonce/timestamp), idempotent keys, exponential retries.
- Data: Redis cache with TTL/invalidation guarantees; Supabase Postgres for app data; ClickHouse for analytics; backups and restores tested.
- Observability: Structured logs, metrics, traces; security alerts for anomalies (e.g., sudden tier changes, failed webhook spikes).

### Audit Requirements

- Append‑only event store for portfolio mutations and payment/webhook events with actor, timestamp, and rationale.
- Versioned calculations via `calculation_version` and optional “recalculate with latest methodology” toggle.
- Export capabilities for audit and user rights (≤ 2 seconds target as defined in success criteria).
- Retention schedule and deletion workflows aligned with PDPA/GDPR and business needs.

### Fraud Prevention

- Webhook integrity: Signature validation, narrow time windows, nonce replay protection, deduplication keys.
- Anomaly detection: Alerts on abnormal subscription transitions and webhook patterns; manual review queue.
- Client defenses: Rate limits, login throttling, 2FA readiness, credential stuffing protections.
- Provider hygiene: IP allowlists if supported; reconciliation to flag inconsistencies.

## Innovation & Novel Patterns

### Detected Innovation Areas

- Unified Portfolio Dashboard: A single "cockpit" view connecting multiple asset classes and portfolios with aggregated performance metrics, rather than segregated tabs.
- Transparent Methodology: Inline “show methodology” panels that surface formulas and lineage, including separation of FX gains vs asset gains.
- Cross‑Border Parity: VN stocks, US equities, and crypto treated equally with staleness badges and freshness cues.
- Resilient Payments: Dual providers (SePay/Polar) with reconciliation; operational resilience as part of UX trust.
- Star Schema‑First Analytics: From day one, lineage and versioning enable auditable insights.

### Market Context & Competitive Landscape

- Baseline Trackers: US‑centric portfolio apps and crypto‑only trackers often lack VN coverage and transparent calculations.
- Differentiation: Polished premium UX + explicit methodology + cross‑border parity + resilience signals (staleness banners, payment states).

### Validation Approach

- Behavioral KPIs: Down‑day sessions ≥ 2 minutes; tab switches ≥ 1.4× baseline; time‑to‑first‑complete‑portfolio ≤ 10 minutes; drill‑down ≤ 3 clicks.
- Experiments: Measure staleness badge impact on perceived trust; test upgrade modal timing and messaging.
- Instrumentation: Client events (tab changes, dwell, refresh); backend timings; price freshness; upgrade prompts at free‑tier limits.
- Qualitative: Usability tests on volatility scenarios; think‑aloud studies; short diary studies for daily check‑ins.

### Risk Mitigation

- Navigation Pattern: Enhanced Tabbed Navigation as primary; Spatial Stage Slider documented for Phase 2+ exploration.
- Progressive Disclosure: Methodology panels collapsed by default; clear affordances to avoid cognitive overload.
- Performance Guardrails: Cache TTLs, pagination, virtualization; defer heavy charts offscreen.
- Operational Resilience: Staleness banners and graceful payment failure states; nightly reconciliation.

### Decision

- Adopt Enhanced Tabbed Navigation for v1.0 as the primary interaction model (safety-first, proven pattern).
- Spatial Stage Slider documented as Phase 2+ exploration pending dedicated UX research budget.
- Phase 2 may introduce split-pane compare mode at XL breakpoints for side-by-side asset class comparison.

## Web App Specific Requirements

### Project-Type Overview

SPA dashboard (React 19 + Vite) with Enhanced Tabbed Navigation (smooth transitions, micro-interactions), TradingView widgets for charts, NestJS API for business logic and caching, Supabase Auth/Postgres for users/portfolios/transactions, ClickHouse for analytics, and Redis for hot data. Refresh strategy is polling-first with explicit staleness cues and resilience flows.

### Technical Architecture Considerations

- SPA choice: Client-side routing; code-split heavy panels and charts; SSR/pre-render reserved for marketing pages.
- Data fetching: Polling cadence ≈ 60s; Redis TTL ≈ 30s; staleness badges at > 5 minutes; exponential backoff during provider outages.
- State: Global store for portfolio summaries; memoized selectors per stage (VN/US/Crypto); virtualization for large lists.
- Charts: Lazy mount TradingView components; defer heavy renders offscreen; support reduced motion mode.

### Browser Matrix

- Desktop: Chrome/Edge/Firefox latest; Safari 15+.
- Mobile: iOS Safari current; Android Chrome current.
- Test Matrix: Playwright E2E across desktop/mobile; weekly CI smoke; quarterly full matrix; graceful degradation if WebGL unavailable.

### Responsive Design

- Breakpoints: sm ≤ 640px (bottom tab bar), md 641–1024px (horizontal scrollable tabs), lg 1025–1440px (standard tab layout), xl ≥ 1441px (tabs + optional split-view compare in Phase 2).
- Touch targets: ≥ 44px; swipe support for tab navigation on mobile; sticky headers; accessible scroll anchors.
- Layout: Single-pane content with tab-based switching; auto-fallback to bottom tab bar on small screens; avoid horizontal overflow.

### Performance Targets

Moved to Non‑Functional Requirements → Performance.

### SEO Strategy

- Marketing: Pre-render/SSR marketing pages with canonical links, sitemap, basic schema; UTM tracking; app routes `noindex`.
- App: Authenticated SPA focuses on performance/accessibility/reliability rather than SEO.

### Accessibility

See Non‑Functional Requirements → Accessibility.

### Implementation Considerations

- Feature Flags: Reduced motion, experimental charts, Phase 2 features (split-view compare, spatial slider exploration).
- Testing: Playwright E2E (matrix above); visual regression; accessibility checks; network throttling tests for staleness behavior.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP + Revenue MVP hybrid (deliver Enhanced Tabbed Navigation and launch paid tiers at v1.0).
**Resource Requirements:** 2–3 full‑stack TypeScript developers (NestJS/React), 1 part‑time designer, PM; access to existing Airflow/ClickHouse.
**Timeline:** 6-8 weeks to MVP (2.5 weeks saved by removing CSV validation complexity).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** Signup → Activation; Daily Calm‑Under‑Volatility; CSV Import; Upgrade Flow; Recovery journeys (staleness, payment, CSV).

**Must‑Have Capabilities:**

- Authentication (Supabase) and portfolios; manual transaction entry with autocomplete (symbol search, recent assets) and keyboard shortcuts.
- Crypto API Integration (Binance + OKX via CCXT library); OAuth flow; real-time balance sync; read-only access; automatic refresh every 60s.
- Enhanced Tabbed Navigation dashboard; allocation visuals; TradingView charts (RSI/MACD/MA via 3rd‑party first; Airflow fallback if absent).
- Net worth engine with FX separation; staleness badges; polling cadence ≈ 60s; Redis TTL ≈ 30s.
- Payments: SePay (VND) + Polar (USD) with signature verification, idempotent webhooks, retries + reconciliation; no partial upgrades.
- Data warehouse Star Schema: `Fact_Trades`, `Fact_Holdings_Daily`, `Fact_Portfolio_Valuation_Daily`; `Dim_Date`, `Dim_Asset` (SCD2), `Dim_Account`, `Dim_Platform`.
- Observability: RUM + backend metrics; admin reconciliation dashboard; append‑only audit logs for portfolio/payment events.

### Post‑MVP Features

**Phase 2 (Growth):** AI insights (Gemini), faster polling for paid tier, FX breakdown views, advanced TradingView charts, holdings snapshot notifications, cohort‑based upgrade prompts, CSV import (experimental beta) for VN/US brokers if manual entry becomes top churn reason.

**Phase 3 (Expansion):** Team collaboration, real‑time streams, developer API, mobile app, corporate actions automation (dividends/splits/rights) and enhanced risk analytics (Sharpe, Beta, correlations).

### Risk Mitigation Strategy

**Technical Risks:** Payment webhook idempotency and retries; cache invalidation guarantees on portfolio mutations; crypto API rate limits and connection failures; OAuth token refresh handling.

**Market Risks:** Validate calm UX via down‑day cohorts; instrument conversion prompts at free‑tier limits; pricing A/B tests.

**Resource Risks:** Feature flags to defer non‑essential complexity; reduced motion mode to mitigate performance; prioritize VN broker CSV coverage first; small team sequencing.

## Non-Functional Requirements

### Performance

- API Response: P95 latency < 200ms for cached endpoints; < 500ms for analytics endpoints.
- UI Responsiveness: Time to interactive ≤ 2 seconds on broadband; chart mounts ≤ 1 second; INP P75 ≤ 200ms; CLS ≤ 0.1.
- Polling Cadence: Frontend polling ≈ 60 seconds; Redis TTL ≈ 30 seconds; staleness badge appears when freshness exceeds 5 minutes.

### Reliability & Availability

- Uptime: API availability 99.9% monthly.
- Payments: Processing success ≥ 98% across SePay (VND) and Polar (USD).
- Resilience: Webhook processing is idempotent with signature verification, replay protection, exponential backoff retries, and nightly reconciliation.
- Data Integrity: Append‑only audit logs; versioned calculations via `calculation_version` with optional “recalculate with latest methodology.”

### Security

- Transport Security: TLS everywhere; HSTS; CSP; modern ciphers; secure headers baseline (X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy).
- Authentication/Authorization: Supabase OAuth/JWT; RBAC/RLS; least privilege; secrets encrypted at rest; periodic key rotation.
- Input Safety: Validation and sanitization for user inputs; rate limiting; brute‑force and credential‑stuffing protections; session management hardening.

### Privacy & Compliance

- Framework Alignment: PDPA (Vietnam) and GDPR — consent registry, data minimization, rights (export/delete/correct), transparent privacy policy.
- Cross‑Border Transfers: Provider DPAs and safeguards (e.g., SCCs or equivalents) documented.
- Payments Scope: No card storage; enforce webhook signature verification, time‑window checks, nonce replay protection, and idempotency keys.

### Accessibility

- Standard: WCAG 2.1 AA; keyboard navigation for tabbed interface (arrow keys, Enter/Space); ARIA landmarks/labels for charts and staleness banners; color contrast ≥ 4.5:1; respect `prefers-reduced-motion`.
- Audits: Automated axe/Lighthouse in CI; quarterly manual accessibility reviews.

### Scalability

- Launch Scale: Support hundreds of users at public launch; scalable to low thousands without architectural change.
- Load Handling: Maintain performance targets under 5× normal traffic; avoid cache thrash during concurrent polling.
- Growth Path: Horizontal scaling for API and Redis; ClickHouse tuned for read workloads via materialized views.

### Observability

- Metrics: Frontend RUM for TTI, INP, CLS; backend latency/error rates; price freshness indicators; webhook retry/dedup counts.
- Logging: Structured logs with correlation IDs; comprehensive audit logs for portfolio mutations and payments.
- Alerts: Threshold‑based alerts for staleness, payment anomalies, and import failure rates; dashboards for cohorts (down‑day vs normal).

## PRD Completion & Next Steps

### Completion Summary

This PRD for fin‑sight is complete and ready to guide UX, architecture, and development. It includes Executive Summary, Success Criteria and measurable outcomes, User Journeys, Domain‑Specific Requirements, Innovation analysis, Web App project‑type requirements, Functional Requirements (capability contract), Non‑Functional Requirements, and Scoping.

### Suggested Next Workflows

- UX Design: Use journeys and FRs to design the Spatial Stage Slider, dashboards, imports, payments, and recovery states.
- Technical Architecture: Use project‑type requirements and NFRs to finalize NestJS/Supabase/Redis/ClickHouse topology, caching strategy, and observability.
- Epics & Stories: Convert FRs into implementable epics and stories; sequence Phase 1 MVP as defined.

### Validation Checklist

- Vision clarity and differentiator present.
- Success criteria measurable and aligned to activation/conversion.
- Journeys cover primary, recovery, and admin flows.
- FRs comprehensive and testable, organized by capability.
- NFRs specific to performance, reliability, security, privacy, accessibility, scalability, and observability.
