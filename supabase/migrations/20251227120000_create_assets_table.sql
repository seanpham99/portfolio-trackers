-- Migration: Create unified assets table using Single Table Inheritance (STI)
-- Story: prep-3-seed-asset-data
-- Architecture: STI with JSONB metadata extension
--
-- Design Decision:
-- - Single table scales to 100+ markets without schema changes
-- - asset_class is discriminator: STOCK, CRYPTO, BOND, ETF, FOREX
-- - market column for country/exchange (VN, US, UK, JP)
-- - metadata JSONB for type-specific fields (isin, chain, etc.)

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===================================================================
-- TABLE: assets (Single Table Inheritance)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.assets (
  -- Primary identifier (synthetic to handle multi-listing)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  
  -- Common fields (all asset types)
  name_en text NOT NULL,
  name_local text,                     -- Local language name (e.g., Vietnamese for VN stocks)
  
  -- Classification
  asset_class text NOT NULL,           -- Discriminator: STOCK, CRYPTO, BOND, ETF, FOREX
  market text,                         -- ISO alpha-2: VN, US, UK, JP (NULL for CRYPTO/FOREX)
  currency text NOT NULL,              -- ISO 4217: VND, USD, GBP, JPY
  exchange text,                       -- Exchange code: HOSE, NASDAQ, NYSE
  
  -- Common metadata
  sector text,
  industry text,
  logo_url text,
  
  -- Type-specific metadata (flexible JSONB)
  -- STOCK: {isin, cik, sedol, cusip, figi}
  -- CRYPTO: {coingecko_id, chain, contract_address, is_stablecoin}
  -- BOND: {isin, maturity_date, coupon_rate, credit_rating}
  metadata jsonb DEFAULT '{}',
  
  -- Data lineage
  source text,                         -- vnstock, yfinance, coingecko
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_asset_symbol_market UNIQUE (symbol, market, asset_class),
  CONSTRAINT valid_asset_class CHECK (
    asset_class IN ('STOCK', 'CRYPTO', 'BOND', 'ETF', 'FOREX')
  ),
  CONSTRAINT market_required_for_stocks CHECK (
    (asset_class = 'STOCK' AND market IS NOT NULL) OR
    (asset_class != 'STOCK')
  )
);

-- Comments
COMMENT ON TABLE public.assets IS 'Unified asset master data using Single Table Inheritance (STI). Synced nightly from ClickHouse.';
COMMENT ON COLUMN public.assets.asset_class IS 'Discriminator column: STOCK, CRYPTO, BOND, ETF, FOREX';
COMMENT ON COLUMN public.assets.market IS 'ISO 3166-1 alpha-2 country code for stocks (VN, US, UK). NULL for crypto/forex.';
COMMENT ON COLUMN public.assets.metadata IS 'Type-specific fields. STOCK: {isin, cik, sedol}. CRYPTO: {coingecko_id, chain, is_stablecoin}.';

-- ===================================================================
-- INDEXES
-- ===================================================================

-- Primary symbol lookup
CREATE INDEX idx_assets_symbol ON public.assets(symbol);
CREATE INDEX idx_assets_symbol_market ON public.assets(symbol, market) WHERE market IS NOT NULL;

-- Classification indexes
CREATE INDEX idx_assets_asset_class ON public.assets(asset_class);
CREATE INDEX idx_assets_market ON public.assets(market) WHERE market IS NOT NULL;
CREATE INDEX idx_assets_asset_class_market ON public.assets(asset_class, market);

-- Fuzzy search for autocomplete (trigram)
CREATE INDEX idx_assets_name_en_trgm ON public.assets USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_assets_name_local_trgm ON public.assets USING gin(name_local gin_trgm_ops) 
  WHERE name_local IS NOT NULL;

-- JSONB metadata index
CREATE INDEX idx_assets_metadata ON public.assets USING gin(metadata);

-- Composite for common queries
CREATE INDEX idx_assets_autocomplete ON public.assets(symbol, name_en, asset_class);

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all assets (read-only master data)
CREATE POLICY "Users can view all assets"
  ON public.assets
  FOR SELECT
  TO authenticated
  USING (true);

-- ===================================================================
-- TRIGGER
-- ===================================================================

CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
