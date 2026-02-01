# Retrospective: Epic 5 - Automated Exchange Sync & Connections

**Date:** 2026-02-01
**Participants:** Alice (PO), Bob (SM), Charlie (Dev), Dana (QA), Son (Project Lead)
**Status:** Completed

## 1. Epic Review

### Summary

Epic 5 delivered the core automated tracking capabilities for the platform, enabling users to sync Binance and OKX balances without manual entry. The team achieved 100% story completion with high quality and stability.

### Successes (What Went Well)

- **Architecture (ExchangeProvider)**: The decision to refactor into a generic `ExchangeProvider` interface made adding OKX (and future exchanges) trivial.
- **UX (Calm Design)**: The "Connections Hub" implements the "Calm" design philosophy effectively with staleness badges and rate-limited manual syncs.
- **Stability**: Background polling (Story 5.4) successfully uses concurrency limits (`p-limit`) to avoid rate-limiting issues under load.
- **Security**: Successfully implemented AES-256-GCM encryption for API secrets.

### Challenges (What Can Improve)

- **Type Synchronization**: We experienced drift between Frontend Zod schemas and Backend Types/DTOs, leading to integration friction.
- **Error Granularity**: "Sync Failed" messages are too generic. Users need to know if the error is actionable (e.g., "Invalid Key") or temporary (e.g., "Maintenance").

## 2. Next Epic (Epic 6) Preparation

### Strategic Direction

The team, led by Son, decided to **prioritize Foundation & Monetization** (Freemium Limits + SePay) over AI features. Establishing a secure revenue engine is the primary goal for Epic 6.

### Critical Preparation Blocks (Action Items)

Before strictly starting feature work, the following technical foundation must be laid:

| Item                         | Priority | Owner   | Rationale                                                                                                        |
| :--------------------------- | :------- | :------ | :--------------------------------------------------------------------------------------------------------------- |
| **Supabase Vault Migration** | **High** | Charlie | Move from app-side crypto to Supabase Vault (TDE) for robust security before processing payments.                |
| **Shared Validation Logic**  | **High** | Charlie | Implement a shared validation strategy to ensure "Free Tier" limits cannot be bypassed by frontend manipulation. |

### Other Improvements

- **Granular Error Feedback**: To be improved iteratively.
- **Testability**: Add a "Force Run" command for the scheduler to improve E2E test speed.

## 3. Action Plan

1. **Add "Story 6.0: Technical Foundation"** to Epic 6 to explicitly track the Vault and Validation work.
2. **Update Sprint Status** to mark this retro as done.
