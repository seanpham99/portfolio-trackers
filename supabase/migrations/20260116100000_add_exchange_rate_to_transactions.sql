-- Migration: Add exchange_rate column to transactions
-- Story: 2.3-multi-currency-accounting-fx-separation
-- Add exchange_rate column
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1 CHECK (exchange_rate > 0);
-- Update comments
COMMENT ON COLUMN public.transactions.total IS 'Auto-calculated total value including fees (in Asset Currency).';
COMMENT ON COLUMN public.transactions.exchange_rate IS 'Exchange rate to Portfolio Base Currency (default 1).';