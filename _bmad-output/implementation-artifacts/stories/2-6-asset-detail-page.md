# Story 2.6: Asset Detail Page Content

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to click on an asset in my dashboard to see its detailed performance and transaction history,
So that I can analyze why I'm making or losing money on this specific holding.

## Acceptance Criteria

1. **Given** I am on the Unified Dashboard
2. **When** I click a row in the Holdings Table (e.g., "AAPL")
3. **Then** I should navigate to `/asset/AAPL` (or open a detailed panel)
4. **And** I should see a **Price Chart** (TradingView widget)
5. **And** I should see a **Transaction History** list filtered for this asset (Buys/Sells)
6. **And** I should see my **Your Stats** card (Avg Cost, Total Return, Unrealized P/L).

## Tasks / Subtasks

- [ ] **Task 1: Asset Detail Layout**
  - [ ] Create route `/routes/_protected.asset.$symbol.tsx`.
  - [ ] Implement header with Asset info (Name, Price, Badge).

- [ ] **Task 2: Chart Integration**
  - [ ] Embed TradingView widget (lightweight-charts or advanced-chart widget).

- [ ] **Task 3: Transaction History Component**
  - [ ] Reuse generic Transaction List but filter by Symbol.

## Dev Notes

- **UX:** Deep dive experience. Should feel "Institutional".

### Project Structure Notes

- **Location:** `apps/web/src/routes/_protected.asset.$symbol.tsx`

### References

- [Design: Asset Detail Spec](../project-planning-artifacts/ux/ux-design-specification.md)
