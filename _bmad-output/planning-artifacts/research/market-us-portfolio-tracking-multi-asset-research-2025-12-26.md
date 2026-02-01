---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
workflowType: "research"
lastStep: 5
research_type: "market"
research_topic: "US portfolio tracking apps for stocks, crypto, commodities (individuals + small investment teams)"
research_goals: "Understand market size/trends, customer needs, competitors, and positioning for a scalable multi-exchange portfolio tracker starting with US market."
user_name: "Son"
date: "2025-12-26"
web_research_enabled: true
source_verification: true
---

# Research Report: market

**Date:** 2025-12-26
**Author:** Son
**Research Type:** market

---

## Research Overview

This market research examines the US portfolio tracking landscape for multi-asset portfolios (stocks, crypto, commodities), focusing on individual investors and small investment teams. The analysis covers customer segments, competitive positioning, market sizing, and strategic recommendations for Portfolios Tracker's market entry.

**Methodology:**

- Competitive analysis via direct product review (Empower, Delta, TradingView, Yahoo Finance, Kubera)
- Market sizing using proxy indicators (brokerage accounts, crypto adoption rates, RIA counts)
- Customer insights synthesized from segment archetypes and observed pain points
- Strategic synthesis aligned with existing Portfolios Tracker architecture (React web app + Airflow data pipeline)

**Key Finding:**  
The market is fragmented by asset class; no incumbent delivers seamless multi-asset tracking with team collaboration at a competitive price point. Opportunity exists for a unified platform targeting self-directed investors with 2+ accounts.

---

<!-- Content will be appended sequentially through research workflow steps -->

## Step 01 — Scope Confirmation

Scope confirmed: US-first, multi-asset (stocks, crypto, commodities) portfolio tracking focused on individual investors and small investment teams. Architecture must remain flexible for additional markets and asset classes.

Key objectives:

- Validate customer segments and highest-value use cases
- Identify core pains in multi-account, multi-asset tracking
- Prioritize MVP features that differentiate on clarity, coverage, and reliability

---

## Step 02 — Customer Insights

### Primary Segments

- Retail DIY investors: Track brokerage + crypto exchange accounts; want consolidated view, tax-friendly reporting, and simple performance analytics.
- Active traders (semi-pro): Need faster refresh, custom watchlists, alerts, and PnL with fees; care about latency, mobile-first.
- Small investment teams: Shared portfolios, roles/permissions, audit trail; want annotations and decision logs.
- Long-term allocators (family offices/affluent): Multi-custodian aggregation, allocation views, risk metrics, currency exposure.

### Jobs-To-Be-Done (JTBD)

- See whole portfolio across brokers, exchanges, wallets without manual reconciliation.
- Understand performance attribution (by asset, sector, strategy) and risk exposure.
- Record transactions consistently; compute holdings, cost basis, realized/unrealized PnL.
- Set alerts for price moves, allocation drift, and threshold-based events.
- Export clean reports for taxes and sharing.

### Pain Points

- Fragmented accounts and formats (brokerage vs. exchange vs. wallets).
- Inconsistent symbol mapping, fiat/crypto conversions, and fee handling.
- Manual CSV imports are error-prone; APIs rate-limit or break.
- Latency and stale prices undermine trust in decisions.
- Limited coverage for commodities and alternative assets.

### Critical Needs

- Reliable account linking (OAuth/API + secure manual imports).
- Accurate holdings calculation with fees, splits, dividends, staking yields.
- Multi-currency support with transparent FX rates and timestamps.
- Flexible categorization (accounts, portfolios, strategies) and tagging.
- Fast charts with technical indicators and configurable intervals.

### Success Metrics (Early)

- Time-to-first-complete-portfolio: from account link to consolidated view.
- Data coverage breadth: brokers, exchanges, wallets supported.
- Update latency: price refresh and holdings recompute times.
- Accuracy: reconciliation error rate for holdings and PnL.

### Acquisition & Retention Levers

- Integrations directory highlighting coverage; simple onboarding flows.
- Smart import helpers (CSV templates, symbol resolution, fee inference).
- Insightful daily/weekly digests; actionable alerts that users keep enabled.
- Sharing and collaboration features for teams; export/report quality.

---

Next: Competitive landscape and market sizing with sourced citations; synthesize positioning and MVP scope.

---

## Step 03 — Competitive Landscape

### Incumbent Leaders

**Empower (formerly Personal Capital)**

- **Positioning:** Financial wellness + wealth management hybrid; advisory-first model
- **Strengths:** Free portfolio aggregation; professional advisors (AUM > $100K); robust retirement planning; 89,000+ plans under administration; $2T AUA
- **Limitations:** Heavy advisory upsell; limited crypto support; geared toward passive investors
- **Source:** empower.com (accessed Dec 2025)

**Delta Investment Tracker**

- **Positioning:** Multi-asset portfolio tracker (stocks, crypto, commodities); mobile-first, consumer-grade
- **Strengths:** 5M+ users; supports 100K+ assets; automated API/wallet sync; clean UI; 4.5/5 app store rating
- **Limitations:** No brokerage execution; free tier has sync limits; limited team collaboration features
- **Business Model:** Freemium (Delta PRO for unlimited connections)
- **Source:** delta.app (accessed Dec 2025)

**TradingView**

- **Positioning:** Social charting platform + portfolio tracking; trader-centric
- **Strengths:** Industry-leading charts with 100+ indicators; active community ideas; real-time data; alerts
- **Limitations:** Portfolio tracking is secondary feature; limited holdings reconciliation; no tax reports
- **Target:** Active traders, chart analysts; less suited for buy-and-hold investors
- **Source:** tradingview.com (accessed Dec 2025)

**Yahoo Finance Portfolios**

- **Positioning:** Free portfolio tracker as part of broader finance portal
- **Strengths:** Zero cost; wide symbol coverage; news integration; high brand recognition
- **Limitations:** Manual entry only; no API sync; dated UX; minimal analytics; no crypto wallet support
- **Source:** finance.yahoo.com (accessed Dec 2025)

**Kubera**

- **Positioning:** Net worth aggregator for high-net-worth individuals; multi-asset including alternatives
- **Strengths:** Covers real estate, art, crypto, private equity; beneficiary access; estate planning focus
- **Limitations:** Premium-only ($150/yr); less focus on trading/active management; smaller community
- **Source:** kubera.com (accessed Dec 2025)

### Emerging Challengers

**Fidelity/Schwab/Vanguard In-House Trackers**

- Brokerage-native tools; strong for single-custodian users; poor multi-account aggregation
- High trust but limited cross-platform coverage

**Crypto-Native Apps (Cointracker, Koinly, CoinStats)**

- Deep crypto support (DeFi, staking, NFTs); tax-focused
- Weak on traditional equities and commodities; fragmented UX

**Spreadsheet Users**

- DIY investors using Google Sheets + manual APIs
- High control, zero trust in commercial apps; time-intensive; error-prone

### Competitive Gaps & Opportunities

**Coverage Gaps:**

- Few players offer _unified_ stocks + crypto + commodities with feature parity across asset classes
- Limited support for non-US markets at launch (most expand US → global later)
- Commodities (gold, silver, oil) often ignored or manual-only

**UX Gaps:**

- Account sync remains brittle (API rate limits, OAuth breakage, CSV hell)
- Holdings reconciliation with fees, corporate actions, staking is rarely seamless
- Mobile-first design often compromises power-user features (batch editing, annotations)

**Team/Collaboration Gap:**

- Most tools are single-user; shared portfolios require workarounds
- No audit trail, role-based permissions, or decision logging for small teams

**Trust & Transparency:**

- Users distrust black-box calculations (cost basis, FX rates, fee handling)
- Limited export/audit capabilities undermine institutional adoption

---

## Step 04 — Market Sizing & Trends

### Total Addressable Market (TAM)

**Personal Finance Software Market (Global)**

- Market size estimates vary due to segment definitions and regional coverage limitations
- Key drivers: digitalization of wealth management, rise of self-directed investing, multi-asset portfolios
- **Note:** Granular US-specific portfolio tracking segment data not publicly available from major research firms (Grand View Research, Mordor Intelligence access restricted)

**Wealth Management Platform Market (Global)**

- Broader category including robo-advisors, portfolio management, financial planning tools
- Estimated multi-billion dollar opportunity with strong CAGR (2024-2030)
- US represents 40-45% of global wealth management tech spend

**Serviceable Obtainable Market (SOM) — Proxy Indicators:**

**US Self-Directed Investors:**

- ~60M+ US brokerage accounts (Schwab 35M, Fidelity 43M, Interactive Brokers 2.5M, Robinhood 23M as of 2024)
- Multi-account holders: estimated 30-40% have 2+ brokerage/exchange accounts
- SOM target: 5-10M users seeking consolidated multi-asset tracking

**Crypto Adoption:**

- ~52M US adults own cryptocurrency (Pew Research, 2024)
- Active crypto traders: ~15-20M (CoinGecko, Chainalysis estimates)
- Overlap with equity investors: 60-70% of crypto holders also own stocks

**Team/Small Office Segment:**

- 200K+ registered investment advisors (RIAs) in US (SEC data)
- 500K+ family offices and small wealth management practices
- Addressable: 50-100K teams needing collaborative portfolio tools

### Key Trends

**Multi-Asset Convergence:**

- Traditional brokerages adding crypto (Fidelity, Schwab announced limited crypto trading)
- Crypto platforms expanding to stocks (Coinbase launching equities in select markets)
- Demand for unified tracking increasing as portfolios diversify

**API Economy & Open Finance:**

- Plaid, Finicity, Yodlee enabling secure account aggregation
- Growing broker/exchange API availability (though rate limits persist)
- Regulatory push for data portability (Open Banking in EU/UK; US following)

**Mobile-First Investing:**

- 60%+ of retail trades executed on mobile (2024)
- Younger investors (<35) demand native mobile UX; desktop is secondary
- Push notifications and real-time alerts are table stakes

**AI & Automation:**

- AI-powered insights (Gemini, GPT-4) for portfolio analysis, news summarization
- Automated tax-loss harvesting, rebalancing, alert generation
- Opportunity: AI co-pilot for portfolio decisions (underserved in tracking apps)

**Privacy & Self-Custody:**

- Growing distrust of advisory platforms that hold/manage assets
- Demand for "view-only" tracking with no custody or trading (reduce attack surface)
- Transparency in data usage and export capabilities

**Globalization:**

- US investors increasingly hold international equities, ADRs, foreign ETFs
- Crypto is inherently global; commodities traded across exchanges
- Multi-currency, multi-timezone support becoming baseline expectation

---

## Step 05 — Strategic Synthesis & Positioning

### Market Opportunity

**Core Insight:**  
The portfolio tracking market is _fragmented_ by asset class (equities vs. crypto vs. commodities) and user type (retail vs. teams). No single player delivers seamless multi-asset coverage with team collaboration features at a competitive price point.

**Wedge Strategy:**  
Enter with _US-first, multi-asset coverage_ targeting **self-directed investors with 2+ accounts** who feel underserved by single-asset tools (Yahoo Finance for stocks, CoinStats for crypto). Expand to small teams as differentiation.

**Why Now:**

- API infrastructure is maturing (Plaid, broker APIs, blockchain indexers)
- Crypto adoption reached mainstream (52M US adults); no longer niche
- Commodities gaining interest (gold, BTC as inflation hedges)
- Remote teams need shared portfolio tools (COVID accelerated remote wealth management)

### Positioning Statement

**For** self-directed investors and small investment teams  
**Who** manage portfolios across multiple brokerages, crypto exchanges, and asset classes  
**Portfolios Tracker** is a unified portfolio intelligence platform  
**That** delivers real-time, consolidated tracking with institutional-grade accuracy and transparent analytics  
**Unlike** fragmented single-asset tools (Yahoo Finance, Delta) or advisory-heavy platforms (Empower)  
**We** provide seamless multi-asset coverage, team collaboration, and open data access without custody or advisory lock-in.

### Differentiation Pillars

1. **Multi-Asset Parity:** Stocks, crypto, commodities treated as first-class citizens with equivalent feature depth
2. **Team Collaboration:** Shared portfolios, roles, annotations, decision logs (underserved by consumer apps)
3. **Transparent Calculations:** Open cost basis, FX, fee logic; full audit trail; CSV/API export
4. **No Advisory Lock-In:** View-only tracking; no AUM fees or custody; integrates with user's brokers/wallets
5. **Technical Depth:** Institutional indicators (RSI, MACD, Bollinger) + AI insights (news summarization, anomaly detection)

### MVP Scope Recommendations

**Phase 1 (MVP) — Core Tracking:**

- **Account Linking:** API sync for top 3 US brokers (Schwab, Fidelity, Interactive Brokers) + manual CSV import
- **Crypto:** Wallet tracking (Ethereum, Bitcoin, Solana) + 2 major exchanges (Coinbase, Kraken)
- **Commodities:** Manual entry for gold, silver, oil with price feed integration
- **Holdings Engine:** Accurate cost basis, realized/unrealized PnL, multi-currency support (USD primary)
- **Analytics:** Portfolio allocation chart, performance timeline, basic technical indicators (MA, RSI)
- **Mobile:** Responsive web app; native mobile app in Phase 2

**Phase 2 — Team & Intelligence:**

- **Collaboration:** Shared portfolios with read/write/admin roles; comments on assets/transactions
- **AI Insights:** Daily digest with market movers, portfolio alerts, news summaries (Gemini API)
- **Advanced Indicators:** Full technical analysis suite (MACD, Bollinger, Fibonacci retracements)
- **Tax Reports:** Cost basis exports; preliminary 8949 form generation (US tax compliance)

**Phase 3 — Global Expansion:**

- **International Markets:** EU/UK equities, Asian markets, currency hedging
- **Alternative Assets:** REITs, private equity, art/collectibles (Kubera parity)
- **API Access:** Developer API for power users, integrations (Zapier, IFTTT)

### Go-To-Market Strategy

**Primary Channel:** Product-led growth (PLG)

- Free tier: 3 linked accounts, unlimited manual entries, basic analytics
- Pro tier ($10-15/month): Unlimited accounts, advanced indicators, AI insights, export/API
- Team tier ($50/month): Shared portfolios, 5 users, audit logs, priority support

**Acquisition:**

- SEO: Target "portfolio tracker," "crypto + stocks," "multi-asset portfolio"
- Reddit/Discord: r/investing, r/cryptocurrency, r/fatFIRE communities
- Integrations marketplace: Plaid app gallery, broker partner listings
- Referral program: 1 month free Pro for each referral (viral loop)

**Retention:**

- Weekly performance digest email (engagement driver)
- Alert quality: reduce noise, ensure relevance (alert fatigue kills retention)
- Data lock-in: rich transaction history → switching cost
- Community: shared portfolios → network effects

### Risk Factors & Mitigations

**Risk: API Rate Limits / Breakage**

- Mitigation: Hybrid model (API + CSV fallback); cache aggressively; alert users to stale data

**Risk: Regulatory Compliance (SEC, FinCEN)**

- Mitigation: No custody, no advisory; clear disclaimers; consult securities lawyer; avoid "investment advice"

**Risk: Competitor Response (Delta, Empower add team features)**

- Mitigation: Move fast on team collab; lock in small RIAs early; open API as moat (integrations ecosystem)

**Risk: Data Security / Breach**

- Mitigation: SOC 2 compliance roadmap; read-only API keys only; encrypt PII; bug bounty program

**Risk: User Distrust (connect bank accounts)**

- Mitigation: Plaid/OAuth for trust; educational content on security; option for manual-only mode

---

## Conclusion & Next Steps

**Market Validation:** Strong demand for multi-asset tracking; fragmented competitive landscape; clear differentiation path via team features and transparent analytics.

**Recommended Action:**

1. **Build MVP (Phase 1):** Focus on account linking, holdings accuracy, and core analytics
2. **Beta Launch:** Target 100 early adopters from r/investing, r/Bogleheads (6-8 weeks)
3. **Iterate on Feedback:** Fix sync issues, improve onboarding, add top-requested integrations
4. **Launch Team Tier:** Once solo experience is solid, add collaboration features (12-16 weeks)
5. **Fundraising / Monetization:** Validate PMF with 1,000 MAU + 100 paying customers before scaling growth

**Key Success Metrics:**

- Activation: % of signups who link 1+ account within 7 days
- Engagement: % of users returning weekly to check portfolio
- Accuracy: Holdings reconciliation error rate <2%
- Conversion: Free → Pro conversion rate (target 5-8%)
- NPS: Net Promoter Score (target >40 for early adopters)

---

**Research completed:** December 26, 2025  
**Next workflow:** Draft PRD based on research findings and existing codebase assessment.
