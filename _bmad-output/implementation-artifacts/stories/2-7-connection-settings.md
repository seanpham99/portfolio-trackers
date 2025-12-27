# Story 2.7: Connection Management (API Keys & OAuth)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to manage my API connections to exchanges (Binance, OKX),
So that I can keep my crypto portfolio synced automatically.

## Acceptance Criteria

1. **Given** the Settings > Connections page
2. **When** I click "Connect Binance"
3. **Then** I should be guided through either an OAuth flow OR an API Key entry form
4. **And** once connected, I should see a "Synced" status with the last sync timestamp.
5. **And** I should be able to "Disconnect" or "Resync" manually.

## Tasks / Subtasks

- [ ] **Task 1: Connections UI**
  - [ ] Implement `IntegrationCard` list (Binance, OKX, etc.).
  - [ ] Implement `APIKeyForm` modal for manual key entry.

- [ ] **Task 2: Connection Logic**
  - [ ] Implement status polling (to check if sync is running).
  - [ ] Handle error states (Invalid Key, Permission Denied).

## Dev Notes

- **Security:** Never display full API Secret in UI.

### Project Structure Notes

- **Location:** `apps/web/src/routes/_protected.settings.connections.tsx`

### References

- [Design: Connections Spec](../project-planning-artifacts/ux/ux-design-specification.md)
