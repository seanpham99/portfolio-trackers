-- Migration: Create portfolios table
-- Story: 2-1-portfolio-management-logic-api-database
-- Purpose: Store user portfolio data with base currency support
-- Affected tables: public.portfolios
-- Author: Amelia (Dev Agent)
-- Date: 2025-12-27

-- =============================================================================
-- Create the portfolios table
-- =============================================================================
-- This table stores user portfolios with base currency (VND, USD, USDT).
-- Each portfolio belongs to a single user, enforced via RLS and foreign key.

CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_currency text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Currency constraint: only VND, USD, USDT allowed
  CONSTRAINT valid_base_currency CHECK (
    base_currency IN ('VND', 'USD', 'USDT')
  ),
  
  -- Unique constraint: user cannot have duplicate portfolio names
  CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
);

-- Add table comment
COMMENT ON TABLE public.portfolios IS 'User investment portfolios with base currency support. Each user can have multiple portfolios to organize their investments.';

-- Add column comments
COMMENT ON COLUMN public.portfolios.user_id IS 'Foreign key to public.users, owner of this portfolio.';
COMMENT ON COLUMN public.portfolios.name IS 'User-defined portfolio name, unique per user.';
COMMENT ON COLUMN public.portfolios.base_currency IS 'Base currency for valuation: VND, USD, or USDT.';
COMMENT ON COLUMN public.portfolios.description IS 'Optional description of the portfolio.';

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies
-- =============================================================================
-- Following best practices from project patterns:
-- - Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
-- - Use (select auth.uid()) for performance optimization
-- - Specify roles explicitly (authenticated)

-- Policy: Users can view their own portfolios
CREATE POLICY "Users can view their own portfolios"
  ON public.portfolios
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can create their own portfolios
CREATE POLICY "Users can create their own portfolios"
  ON public.portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update their own portfolios
CREATE POLICY "Users can update their own portfolios"
  ON public.portfolios
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own portfolios
CREATE POLICY "Users can delete their own portfolios"
  ON public.portfolios
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Index for user lookup (most common query pattern)
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);

-- Composite index for name lookup within user scope
CREATE INDEX idx_portfolios_user_name ON public.portfolios(user_id, name);

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================
CREATE TRIGGER set_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
