-- Migration: Create transactions table
-- Story: 2.3-manual-transaction-entry-with-autocomplete
-- Architecture: Decision 1.1 (Supabase Postgres Schema Pattern)
-- Enable pg_trgm extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ===================================================================
-- TABLE: transactions
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE RESTRICT,
  -- Core transaction data
  type text NOT NULL,
  -- BUY, SELL
  quantity numeric NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  fee numeric DEFAULT 0 CHECK (fee >= 0),
  total numeric GENERATED ALWAYS AS ((quantity * price) + fee) STORED,
  -- Metadata
  transaction_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Constraints
  CONSTRAINT valid_transaction_type CHECK (type IN ('BUY', 'SELL'))
);
-- Comments
COMMENT ON TABLE public.transactions IS 'Normalized transaction history for all asset types.';
COMMENT ON COLUMN public.transactions.type IS 'Transaction type: BUY, SELL.';
COMMENT ON COLUMN public.transactions.total IS 'Auto-calculated total value including fees.';
-- ===================================================================
-- INDEXES
-- ===================================================================
CREATE INDEX idx_transactions_portfolio_id ON public.transactions(portfolio_id);
CREATE INDEX idx_transactions_asset_id ON public.transactions(asset_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_composite_search ON public.transactions(portfolio_id, transaction_date DESC);
-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only view transactions in their own portfolios
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.portfolios p
      WHERE p.id = transactions.portfolio_id
        AND p.user_id = auth.uid()
    )
  );
-- Policy: Users can insert transactions into their own portfolios
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR
INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.portfolios p
      WHERE p.id = transactions.portfolio_id
        AND p.user_id = auth.uid()
    )
  );
-- Policy: Users can update transactions in their own portfolios
CREATE POLICY "Users can update own transactions" ON public.transactions FOR
UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.portfolios p
      WHERE p.id = transactions.portfolio_id
        AND p.user_id = auth.uid()
    )
  );
-- Policy: Users can delete transactions in their own portfolios
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.portfolios p
    WHERE p.id = transactions.portfolio_id
      AND p.user_id = auth.uid()
  )
);
-- ===================================================================
-- TRIGGER
-- ===================================================================
CREATE TRIGGER set_transactions_updated_at BEFORE
UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();