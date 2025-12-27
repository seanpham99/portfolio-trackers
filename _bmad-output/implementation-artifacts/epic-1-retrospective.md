# Epic 1 Retrospective: Secure Account Foundation

**Date**: 2025-12-27
**Epic**: 1 - Secure Account Foundation
**Participants**:
- **Bob** (Scrum Master)
- **Alice** (Product Owner)
- **Charlie** (Senior Dev)
- **Dana** (QA Engineer)
- **Elena** (Junior Dev)
- **Son** (Project Lead/User)

---

## 🏁 Epic Summary

**Delivery Metrics:**
- **Completed:** 4/4 stories (100%) - All stories marked `done` (1.1, 1.2, 1.3, 1.4).
- **Key Deliverables:**
  - NestJS Monorepo Structure (`apps/web`, `services/api`, `packages/database-types`, `packages/api-types`).
  - Secure Google OAuth & Email Logic.
  - Premium "Consolidated Calm" UI with Glassmorphism.
  - PDPA-Compliant Privacy Consent with Audit Hashing.

**Quality & Compliance:**
- 0 blockers carried forward.
- **Security:** Strict audit trail implemented for privacy consent (using salted hash).
- **Compliance:** PDPA & GDPR requirements met.
- **UI/UX:** Premium aesthetic achieved; some responsive issues identified on 1080p screens.

---

## 🏆 What Went Well (Successes)

1.  **Premium UI Aesthetic:** The team successfully targeted a "premium" feel early on with the "Consolidated Calm" palette and glassmorphism. It sets a high bar for the product.
2.  **Monorepo Architecture:** Splitting `packages/database-types` and `packages/api-types` early has paid off in type safety and code organization.
3.  **Privacy Compliance:** The solution for storing consent without PII (salted hash) was a smart technical win that satisfied legal requirements without bloating the DB.
4.  **Team Velocity:** The team maintained a good pace, delivering all scope without major delays.

---

## 📉 Challenges & Learnings

1.  **Responsive Design Blindspot:** Developing on 4K monitors led to "happy path" design that broke on standard 1080p screens (excessive padding in Auth Layout).
    - **Learning:** We must test on "boring" resolutions (1920x1080) before marking UI stories as done.
2.  **Infrastructure Friction:** The `pnpm db:gen-types` manual step is prone to human error (forgetting to run it).
    - **Learning:** Manual synchronization steps in a high-velocity repo are dangerous; automation is needed.
3.  **CI Reliability:** The CI pipeline (`test.yml`) is failing/flaky due to the new monorepo structure and missing secrets.
    - **Learning:** Infrastructure changes (like adding new packages) must be paired with CI updates immediately.

---

## 🛠 Action Items & Commitments

### 🚨 Critical Path (Must Complete Before Major Epic 2 Work)

1.  **Fix CI Pipeline**
    - **Owner:** Charlie (Senior Dev)
    - **Task:** Debug `apps/web/test` and `.github/workflows/test.yml` to support the new monorepo structure and secrets.
    - **Deadline:** Immediate (Before starting Epic 2).

2.  **Data Seeding**
    - **Owner:** Charlie / Data Engineer
    - **Task:** Seed `Dim_Asset` with top 100 symbols (VN/US/Crypto) to unblock Story 2.3 (Autocomplete).
    - **Deadline:** Immediate.

### 🔄 Process Improvements (Epic 2)

1.  **Initialize E2E Testing**
    - **Owner:** Dana (QA Engineer)
    - **Task:** Set up Playwright infrastructure and write at least 1 critical flow test per story.
    - **Deadline:** Sprint 1 of Epic 2.

2.  **Automate Type Safety**
    - **Owner:** Charlie (Senior Dev)
    - **Task:** Create a git hook or watcher to alert on database type drift.
    - **Deadline:** Sprint 1 of Epic 2.

3.  **Refactor Vite Config**
    - **Owner:** Son / Charlie
    - **Task:** Extract shared Vite configuration to `@repo/config` or `@repo/vite-config` for future scalability (mobile app).
    - **Deadline:** Parallel with early Epic 2 work.

4.  **UI 1080p Verification**
    - **Owner:** All Devs (Enforced by Alice)
    - **Task:** Add "Verify on 1920x1080 viewport" to the Definition of Done for all UI stories.
    - **Deadline:** Effective immediately.

---

## 🚀 Epic 2 Preview: Multi-Asset Portfolio

**Goal:** Users can build a unified view of their wealth by manually logging transactions on a premium tabbed dashboard.

**Key Dependencies:**
- Requires RLS policies from Epic 1 (Done).
- Requires `Dim_Asset` seed data (Pending - Critical Action Item).
- Requires stable CI for complex logic merging (Pending - Critical Action Item).

**Assessment:**
The team is **READY** for Epic 2, contingent on the immediate resolution of the CI pipeline and data seeding tasks. The infrastructure foundation is solid, and the team alignment is high.

---

> **Scrum Master Note:** "This retrospective highlights a mature team mindset—catching process issues (screen resolution, manual steps) early before they become expensive debt. The focus on CI/CD hygiene before tackling complex business logic in Epic 2 is the right call."
