# IMPLEMEMTATION RETROSPECTIVE - Epic 2

## Epic 2: Portfolio Intelligence & Core Financial Accounting

**Date:** 2026-01-16
**Facilitator:** Bob (Scrum Master)
**Participants:** Alice (PO), Charlie (Senior Dev), Dana (QA), Son (Project Lead)

---

## 1. Summary of Execution

We successfully implemented the core financial logic for the platform. This was a critical "plumbing" epic that changed how numbers are calculated, moving from rough estimates (Weighted Average) to tax-compliant precision (FIFO).

- **Stories Completed:** 3/3
- **Key Achievement:** Implemented FIFO Cost Basis and Multi-Currency structure without requiring complex database migrations.

---

## 2. What Went Well?

- **Pragmatic Schema Usage:**
  - _Charlie:_ "We realized the `transactions` table already had a `total` column that was barely used. Repurposing this to store 'Base Currency Cost' saved us from writing and testing a risky database migration for a new column."
- **Quality Catch:**
  - _Dana:_ "We caught a major bug where the Dashboard was still calculating Weighted Average while the Details page used FIFO. Catching this early prevented user confusion."
- **Future-Proofing:**
  - _Alice:_ "Adding the `exchange_rate` field now—even before we have live FX feeds—means our data builds up correctly from Day 1. We won't have to backfill historical exchange rates later."

## 3. Challenges & Lessons Learned

- **Calculation Consistency:**
  - _Lesson:_ When changing a core calculation method (like Cost Basis), we must audit **all** views throughout the app. We missed the Dashboard view initially and had to fix it during verification.
- **Test strictness:**
  - _Lesson:_ Our initial tests for 'FIFO' were checking against floating point numbers too strictly. We need to be careful with precision in financial tests.

## 4. Action Items for Next Epic (Epic 3: TradingView Integration)

- **Data Prep:** Ensure our `assets` table has the correct `symbol` formats that match TradingView's ticker requirements (e.g., `NASDAQ:AAPL` vs `AAPL`).
  - _Owner:_ Charlie
  - _Status:_ To Do
- **Security Check:** We will be embedding external scripts (TradingView Widget). We need to check our Content Security Policy (CSP) headers.
  - _Owner:_ DevOps
  - _Status:_ To Do

## 5. Conclusion

Epic 2 is **DONE**. The foundation is solid. We are ready to move to visualization in Epic 3.
