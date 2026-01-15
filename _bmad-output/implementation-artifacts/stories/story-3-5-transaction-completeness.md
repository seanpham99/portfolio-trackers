# Story 3-5: Transaction Completeness

**Epic:** Epic 3 - Portfolio Intelligence Foundation  
**Status:** Backlog  
**Priority:** P1  
**Story Points:** 3  
**Created:** December 29, 2025  
**Last Updated:** December 29, 2025

---

## Story

**As a** User  
**I want** to capture all relevant transaction details when logging trades  
**So that** I have a complete record for tax reporting and performance analysis

---

## Context

Story 2.3 implemented basic manual transaction entry (date, symbol, type, quantity, price) but lacked critical fields identified in Epic 2 retrospective: fees, timestamp, notes, and source platform. This story completes the transaction data model to support accurate P/L calculations and audit requirements.

This is **not** a mock data story - it implements real database schema changes and API updates.

---

## Acceptance Criteria

### 1. Transaction Form Updates

**Given** the manual transaction entry form from Story 2.3  
**When** a user adds or edits a transaction  
**Then** they should see additional fields:

- **Transaction Fees** (optional):
  - Number input
  - Currency symbol matches transaction currency
  - Default: 0
  - Validation: Non-negative number

- **Transaction Time** (optional):
  - DateTime picker (date + time)
  - Default: Current date/time
  - Format: YYYY-MM-DD HH:MM
  - Timezone: User's local timezone

- **Notes** (optional):
  - Text area (multiline)
  - Max length: 500 characters
  - Placeholder: "Add notes about this transaction..."

- **Source** (optional):
  - Dropdown with common sources:
    - Binance
    - Coinbase
    - Kraken
    - Vanguard
    - Fidelity
    - Interactive Brokers
    - Manual Entry
    - Other (custom text input)
  - Default: "Manual Entry"

### 2. Database Schema Migration

**Given** the existing transactions table  
**When** the migration is applied  
**Then** the following columns should be added:

```sql
ALTER TABLE transactions
ADD COLUMN fees DECIMAL(20, 8) DEFAULT 0,
ADD COLUMN transaction_time TIMESTAMP DEFAULT NOW(),
ADD COLUMN notes TEXT,
ADD COLUMN source VARCHAR(100) DEFAULT 'Manual Entry';

-- Add index for performance
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_source ON transactions(source);
```

**And** existing transactions should have default values populated

### 3. API DTO Updates

**Given** the NestJS API TransactionDto  
**When** the DTO is updated  
**Then** it should include:

```typescript
// transaction.dto.ts
export class CreateTransactionDto {
  @IsUUID()
  portfolioId: string;

  @IsString()
  symbol: string;

  @IsEnum(["buy", "sell"])
  type: "buy" | "sell";

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  date: string;

  // NEW FIELDS
  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsOptional()
  @IsDateString()
  transactionTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}
```

### 4. Holdings Table Fee Display

**Given** the enhanced holdings table from Story 3.3  
**When** a user views holding details  
**Then** they should see:

- Total fees paid for this asset (sum of all transaction fees)
- Displayed in holdings detail popover or expanded row
- Label: "Total Fees: $XX.XX"

### 5. Asset Detail Page Fee Display

**Given** the asset detail page from Story 3.4  
**When** a user views the transaction history  
**Then** each transaction should display:

- Fee amount in transaction row
- Column: "Fees"
- Format: Currency with 2 decimals
- Total fees row at bottom of table

### 6. P/L Calculation with Fees

**Given** a user has transactions with fees  
**When** P/L is calculated  
**Then** fees should be factored in:

**For Buy Transactions:**

```
Cost Basis = (Quantity × Price) + Fees
```

**For Sell Transactions:**

```
Proceeds = (Quantity × Price) - Fees
Realized P/L = Proceeds - Cost Basis of Sold Units
```

**Example:**

```
Buy: 1 BTC @ $40,000 with $5 fee
Cost Basis = (1 × $40,000) + $5 = $40,005

Sell: 0.5 BTC @ $45,000 with $3 fee
Proceeds = (0.5 × $45,000) - $3 = $22,497
Cost Basis of 0.5 BTC = $20,002.50
Realized P/L = $22,497 - $20,002.50 = $2,494.50
```

### 7. Transaction History Enhanced Display

**Given** the transaction history table  
**When** a user views their transactions  
**Then** the table should display:

Updated columns:

1. Date & Time (instead of just Date)
2. Asset
3. Type (Buy/Sell badge)
4. Quantity
5. Price
6. Fees (NEW)
7. Source (NEW)
8. Total Cost/Proceeds
9. Notes (icon with tooltip)
10. Actions (edit, delete)

### 8. Form Validation

**Given** the user submits the transaction form  
**When** validation runs  
**Then** it should enforce:

- Fees cannot be negative
- Fees cannot exceed transaction total (price × quantity)
- Transaction time cannot be in the future
- Notes max length 500 characters
- Source must be from predefined list or valid custom text

---

## Technical Implementation Notes

### Frontend Form Component

```typescript
// components/TransactionForm.tsx
const TransactionForm: React.FC<Props> = () => {
  const [formData, setFormData] = useState({
    // ... existing fields
    fees: 0,
    transactionTime: new Date(),
    notes: "",
    source: "Manual Entry",
  });

  const commonSources = [
    "Binance",
    "Coinbase",
    "Kraken",
    "Vanguard",
    "Fidelity",
    "Interactive Brokers",
    "Manual Entry",
    "Other",
  ];

  // ... form implementation
};
```

### Database Migration File

```sql
-- migrations/YYYYMMDD_add_transaction_fields.sql
BEGIN;

ALTER TABLE transactions
ADD COLUMN fees DECIMAL(20, 8) DEFAULT 0 NOT NULL,
ADD COLUMN transaction_time TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN notes TEXT,
ADD COLUMN source VARCHAR(100) DEFAULT 'Manual Entry';

-- Backfill transaction_time from date field
UPDATE transactions
SET transaction_time = date::timestamp
WHERE transaction_time IS NULL;

-- Add indexes
CREATE INDEX idx_transactions_time ON transactions(transaction_time);
CREATE INDEX idx_transactions_source ON transactions(source);

COMMIT;
```

### P/L Calculation Service Update

```typescript
// services/profitLossCalculation.ts
export const calculateCostBasis = (
  quantity: number,
  price: number,
  fees: number,
): number => {
  return quantity * price + fees;
};

export const calculateProceeds = (
  quantity: number,
  price: number,
  fees: number,
): number => {
  return quantity * price - fees;
};

export const calculateRealizedPL = (
  sellQuantity: number,
  sellPrice: number,
  sellFees: number,
  averageCostBasis: number,
): number => {
  const proceeds = calculateProceeds(sellQuantity, sellPrice, sellFees);
  const costOfSoldUnits = sellQuantity * averageCostBasis;
  return proceeds - costOfSoldUnits;
};
```

---

## Design Requirements

### Visual Design

- **Fees Field**: Dollar icon prefix, optional label
- **DateTime Picker**: Calendar + clock icon, clear format
- **Notes Field**: Expandable text area, character counter
- **Source Dropdown**: Platform logo icons (if available)

### Form Layout

- **Desktop**: Two-column layout (fees + time on one row, notes + source on next)
- **Mobile**: Single column, all fields stacked

### Accessibility

- All new fields have proper labels and ARIA attributes
- DateTime picker is keyboard accessible
- Character counter for notes field
- Clear error messages for validation failures

---

## Definition of Done

- [ ] Transaction form updated with 4 new fields
- [ ] Database migration applied (fees, transaction_time, notes, source)
- [ ] API DTOs updated with new fields and validation
- [ ] P/L calculation logic updated to include fees
- [ ] Holdings table shows total fees per asset
- [ ] Asset detail transaction history displays all new fields
- [ ] Transaction history table shows date+time, fees, source, notes
- [ ] Form validation enforcing business rules
- [ ] Existing transactions backfilled with default values
- [ ] Unit tests for updated P/L calculations (100% coverage)
- [ ] Integration tests for API endpoints with new fields
- [ ] E2E test: Create transaction with all fields → Verify in table
- [ ] Migration rollback script tested
- [ ] Documentation updated (API spec, transaction schema)

---

## Dependencies

- **Story 2.1**: Portfolio Management API (transaction endpoints)
- **Story 2.3**: Manual Transaction Entry (base form)
- **Story 3.3**: Holdings Table (for fee display)
- **Story 3.4**: Asset Detail Page (for transaction history)

---

## Blockers & Risks

**Risk:** Database migration may be slow on large transaction tables  
**Mitigation:** Test migration on staging with production-sized data; add columns in batches if needed

**Risk:** Breaking changes to API may affect existing clients  
**Mitigation:** New fields are optional; existing API calls continue to work with defaults

---

## Notes

### Migration Strategy

1. Add columns with default values (no downtime)
2. Backfill transaction_time from date field
3. Deploy API changes (backward compatible)
4. Deploy frontend changes
5. Monitor for errors, rollback if needed

### Common Fee Structures

- **Crypto Exchanges**: 0.1-0.5% of transaction value
- **Stock Brokers**: $0-$10 flat fee (many now commission-free)
- **Wire Transfers**: $15-$30 for international

### Future Enhancements (Not in this story)

- Auto-calculate fees based on source platform (e.g., Binance = 0.1%)
- Fee optimization suggestions ("You paid $X in fees this year")
- Tax loss harvesting recommendations

---

## Related Stories

- **Story 2-7: Connection Settings** - Uses source field for automated imports
- **Story 6-1: Portfolio Valuation Engine** - Uses complete transaction data for accurate valuations
- **Story 6-2: FX Intelligence** - Needs transaction time for accurate FX rate lookups
