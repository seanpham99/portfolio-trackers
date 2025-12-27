# Story 2.4: Unified Holdings Table

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want a single, sortable list of ALL my assets alongside their asset type (VN/US/Crypto),
So that I can compare performance across markets in one view.

## Acceptance Criteria

1. **Given** the unified dashboard
2. **When** I look at the Holdings section
3. **Then** I should see a table containing assets from ALL classes (VN Stocks, US Equities, Crypto)
4. **And** there should be a "Type" column or badge (e.g., 🇻🇳 VN, 🇺🇸 US, ₿ Crypto)
5. **And** I can filter this table by Asset Class if I want to see only one type.

## Tasks / Subtasks

- [ ] **Task 1: Unified Table Component**
  - [ ] Create `UnifiedHoldingsTable` using TanStack Table.
  - [ ] Columns: Symbol, Name, Type (Badge), Price, 24h %, Value, P/L.

- [ ] **Task 2: Data Aggregation**
  - [ ] Ensure API response includes `type` field for all assets.
  - [ ] Implement client-side or server-side sorting/filtering.

## Dev Notes

- **Design:** Clean rows, hover effects. Red/Green text for P/L.

### Project Structure Notes

- **Location:** `apps/web/src/components/dashboard/unified-holdings-table.tsx`

### References

- [Design: Unified Dashboard Concept](../project-planning-artifacts/ux/ux-design-specification.md)
