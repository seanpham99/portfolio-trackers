# Story 2-7: Connection Settings & Data Import Improvements

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P1 (Foundational for Epic 3)  
**Story Points:** 3  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** improved connection management and data import capabilities  
**So that** I can efficiently manage my portfolio data sources

---

## Context

Story 2-7 was originally part of Epic 2 but was deferred during Sprint 3-4 as the team focused on core holdings table and asset detail page functionality. During the Epic 2 retrospective (Dec 29, 2025), this story was moved to Epic 3 as it provides foundational infrastructure for external data sources needed in portfolio intelligence features.

This story bridges Epic 2 (manual entry) and Epic 3 (analytics) by improving data import capabilities and connection management, enabling users to efficiently populate their portfolios before analyzing performance.

---

## Acceptance Criteria

### 1. Connection Settings Page

**Given** a user navigates to Settings → Connections  
**When** they view the page  
**Then** they should see:

- List of configured connections (exchange APIs, CSV imports)
- Connection status indicators (connected, disconnected, syncing, error)
- Last sync timestamp for each connection
- "Add Connection" button to configure new sources

### 2. Connection Status Display

**Given** a configured data connection  
**When** the user views the connection card  
**Then** they should see:

- Connection name and type (e.g., "Binance API", "CSV Import")
- Status badge with color coding (green=active, red=error, amber=stale)
- Last successful sync timestamp
- Next scheduled sync time (for automated connections)
- "Test Connection" button to verify connectivity

### 3. Bulk Transaction Import (CSV)

**Given** a user wants to import historical transactions  
**When** they upload a CSV file with transaction data  
**Then** the system should:

- Validate CSV format (required columns: date, symbol, type, quantity, price)
- Preview transactions before import (show first 10 rows)
- Detect and flag duplicate transactions
- Allow user to confirm or cancel import
- Display import progress (X of Y transactions imported)
- Show import summary (success count, skipped duplicates, errors)

### 4. Transaction Deduplication

**Given** imported transactions may overlap with existing data  
**When** the system processes the import  
**Then** it should:

- Check for duplicates using: symbol, date, type, quantity, price
- Flag potential duplicates for user review
- Allow user to choose: skip duplicate, keep both, replace existing
- Log deduplication decisions for audit trail

### 5. Import History & Audit Trail

**Given** a user has imported data multiple times  
**When** they view the "Import History" section  
**Then** they should see:

- List of all imports (CSV, API sync)
- Import timestamp and source
- Number of transactions added/updated/skipped
- Link to download original import file (CSV)
- "Undo Import" option for recent imports (last 24 hours)

---

## Technical Implementation Notes

### API Endpoints

```typescript
// Connection management
GET    /api/connections              // List all user connections
POST   /api/connections              // Create new connection
PUT    /api/connections/:id          // Update connection settings
DELETE /api/connections/:id          // Remove connection
POST   /api/connections/:id/test     // Test connection validity

// Transaction import
POST   /api/transactions/import/csv        // Upload CSV for preview
POST   /api/transactions/import/csv/confirm // Confirm and execute import
GET    /api/transactions/import/history    // List import history
POST   /api/transactions/import/:id/undo   // Undo recent import
```

### Database Schema

```sql
-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'csv', 'binance', 'okx', etc.
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL, -- Connection-specific config
  status VARCHAR(50) DEFAULT 'disconnected',
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Import history table
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  connection_id UUID REFERENCES connections(id),
  source_type VARCHAR(50) NOT NULL, -- 'csv', 'api_sync'
  file_name VARCHAR(255),
  transactions_added INTEGER DEFAULT 0,
  transactions_updated INTEGER DEFAULT 0,
  transactions_skipped INTEGER DEFAULT 0,
  import_data JSONB, -- Store original CSV data or API response
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### CSV Format Specification

Required columns:

- `date`: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
- `symbol`: Asset symbol (BTC, AAPL, VNM, etc.)
- `type`: Transaction type (buy, sell)
- `quantity`: Decimal number
- `price`: Decimal number

Optional columns:

- `fees`: Transaction fees (decimal)
- `notes`: Free text notes
- `source`: Source platform (e.g., "Binance", "Vanguard")

Example CSV:

```csv
date,symbol,type,quantity,price,fees,source,notes
2024-01-15,BTC,buy,0.5,42000,5.0,Binance,DCA purchase
2024-02-20,AAPL,buy,10,180.50,0.99,Vanguard,Tech allocation
```

---

## Definition of Done

- [ ] Connections settings page UI implemented
- [ ] Connection status indicators working correctly
- [ ] CSV upload and preview functionality complete
- [ ] Transaction deduplication logic implemented
- [ ] Import history page showing all past imports
- [ ] Undo import functionality working (24h window)
- [ ] API endpoints for connections and imports tested
- [ ] Database migrations applied
- [ ] Unit tests for deduplication logic (>80% coverage)
- [ ] E2E test: Upload CSV → Preview → Confirm → Verify transactions
- [ ] Documentation updated (API spec, CSV format guide)
- [ ] User-facing help text for CSV format requirements

---

## Dependencies

- Epic 2 Story 2.1: Portfolio Management API (database schema)
- Epic 2 Story 2.3: Manual Transaction Entry (transaction validation logic)

---

## Blockers & Risks

None

---

## Notes

- **Moved from Epic 2:** This story was deferred during Epic 2 Sprint 3-4 and moved to Epic 3 during retrospective
- **Deduplication Strategy:** Use hash of (symbol, date, type, quantity, price) for duplicate detection
- **Undo Window:** 24-hour undo window balances data integrity with user error recovery
- **CSV Parser:** Use `papaparse` or similar library for robust CSV parsing
- **Security:** Validate file size (<10MB), file type (CSV only), sanitize inputs

---

## Related Stories

- **Story 3-5: Transaction Completeness** - Extends transaction fields (fees, time, notes, source)
- **Story 4-1: CCXT Integration** - Automated API connection for crypto exchanges
