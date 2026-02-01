# Test Design: portfolios-tracker - System-Level Strategy

**Date:** 2025-12-26
**Author:** Son
**Status:** Approved

---

## Executive Summary

**Scope:** System-level test design and testability review for the portfolios-tracker v1.0 platform. This document outlines the high-level testing strategy, architectural risks, and coverage priorities before proceeding to implementation.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (≥6): 5
- Critical categories: DATA (Inconsistency), SEC (Auth/RLS), BUS (Payments), PERF (Analytics Latency)

**Coverage Summary:**

- P0 scenarios: 8 (~16 hours)
- P1 scenarios: 12 (~12 hours)
- P2/P3 scenarios: 15 (~10 hours)
- **Total effort**: 38 hours (~5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description                                                                 | Probability | Impact | Score | Mitigation                                                                  | Owner | Timeline   |
| ------- | -------- | --------------------------------------------------------------------------- | ----------- | ------ | ----- | --------------------------------------------------------------------------- | ----- | ---------- |
| R-001   | DATA     | Data mismatch between Supabase (holdings) and ClickHouse (prices)           | 2           | 3      | 6     | API-level integration tests with mocked dual-database responses             | Tech  | 2025-12-30 |
| R-002   | SEC      | Supabase RLS bypass allows users to view other users' portfolios            | 2           | 3      | 6     | Automated security gate verifying RBAC/RLS at the database/API boundary     | Sec   | 2025-12-30 |
| R-003   | BUS      | Payment webhook failure (SePay) prevents feature unlocks                    | 2           | 3      | 6     | Idempotent webhook tests with mock provider signatures and retry scenarios  | Tech  | 2025-12-30 |
| R-004   | PERF     | ClickHouse analytics queries exceed 500ms P95 latency under concurrent load | 2           | 3      | 6     | Load testing with k6 specifically targeting the analytics/aggregation layer | Tech  | 2025-12-30 |
| R-005   | TECH     | Crypto API integration (CCXT) hits rate limits or token refresh fails       | 3           | 2      | 6     | Circuit breaker and retry logic validation with network interception        | Tech  | 2025-12-30 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description                                             | Probability | Impact | Score | Mitigation                                                | Owner |
| ------- | -------- | ------------------------------------------------------- | ----------- | ------ | ----- | --------------------------------------------------------- | ----- |
| R-006   | OPS      | Airflow ETL failure leads to stale market data (>5 min) | 2           | 2      | 4     | Health check status tests and UI staleness badge triggers | Ops   |
| R-007   | BUS      | Incorrect TWR/MWR calculation logic                     | 1           | 3      | 3     | Unit testing of valuation engine with varied data lots    | Tech  |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description                                 | Probability | Impact | Score | Action  |
| ------- | -------- | ------------------------------------------- | ----------- | ------ | ----- | ------- |
| R-008   | TECH     | Accessibility violation in charts           | 1           | 2      | 2     | Monitor |
| R-009   | OPS      | Redis cache inconsistency on write mutation | 1           | 2      | 2     | Monitor |

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement                             | Test Level | Risk Link | Test Count | Owner | Notes                                      |
| --------------------------------------- | ---------- | --------- | ---------- | ----- | ------------------------------------------ |
| User Authentication & Profile           | E2E        | R-002     | 2          | QA    | Google OAuth and Email/Pass validation     |
| Portfolio & Account CRUD                | API        | R-002     | 4          | DEV   | Verify Supabase RLS isolation              |
| Manual Transaction Entry (Autocomplete) | E2E        | BUS       | 2          | QA    | Focus on speed and symbol search           |
| Portfolio Valuation (Dual-DB Aggreg)    | API        | R-001     | 4          | DEV   | Mocked ClickHouse + Postgres response join |
| Payment Success Flow (Webhook)          | API        | R-003     | 3          | QA    | Signature verification & Tier change       |

**Total P0**: 15 tests, 16 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement                         | Test Level | Risk Link | Test Count | Owner | Notes                                       |
| ----------------------------------- | ---------- | --------- | ---------- | ----- | ------------------------------------------- |
| Crypto Balance Sync (CCXT)          | API        | R-005     | 4          | DEV   | Mocked exchange responses and rate limits   |
| Technical Indicators (RSI/MACD)     | API/Unit   | BUS       | 6          | DEV   | External vs Fallback internal calculation   |
| Multi-Currency Conversion (FX Gain) | Unit       | BUS       | 8          | DEV   | Separation of asset vs currency GAIN/LOSS   |
| Admin Reconciliation Dashboard      | E2E        | R-003     | 3          | QA    | Verify sync between webhooks and DB records |

**Total P1**: 21 tests, 12 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Successful Login (Auth) (30s)
- [ ] Portfolio List returns 200 (API) (15s)
- [ ] Manual Transaction autocomplete search (45s)

**Total**: 3 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] RLS Security: Cannot access User B portfolio id (API)
- [ ] Valuation: Portfolio value correct with mocked prices (API)
- [ ] SePay Webhook: Tier upgraded on valid signature (API)

---

## Resource Estimates

### Test Development Effort

| Priority  | Count  | Hours/Test | Total Hours | Notes                              |
| --------- | ------ | ---------- | ----------- | ---------------------------------- |
| P0        | 8      | 2.0        | 16          | Complex dual-DB and Auth setup     |
| P1        | 12     | 1.0        | 12          | Standard feature coverage          |
| P2        | 10     | 0.5        | 5           | Simple scenarios and edge cases    |
| P3        | 5      | 1.0        | 5           | Performance (k6) and Accessibility |
| **Total** | **35** | **-**      | **38**      | **~5 days**                        |

### Prerequisites

**Test Data:**

- `Portfolio` factory (Supabase data generation)
- `PriceLot` factory (ClickHouse mock data)
- Auth fixtures (Google/Email session state)

**Tooling:**

- Playwright for E2E
- Jest/Vitest for Unit/API
- k6 for Performance NFRs
- axe-core for Accessibility

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **High-risk mitigations**: 100% complete or approved waivers

---

## Mitigation Plans

### R-001: Dual DB Inconsistency (Score: 6)

**Mitigation Strategy:** Implement an API-level integration test suite that utilizes a transactional wrapper or cleanup fixture for Supabase and a fresh test partition in ClickHouse. Validate that the aggregation service correctly handles mapping symbols to ClickHouse tickers and applies correct FX rates.
**Owner:** Backend Lead
**Timeline:** 2025-12-30
**Status:** Planned
**Verification:** Integration tests covering `AggregationService` with 100% branch coverage.

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: Son Date: 2025-12-26
- [ ] Tech Lead: Pham Date: 2025-12-26

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
