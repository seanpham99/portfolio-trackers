-- Migration: Add user settings columns to user_preferences
-- Purpose: Store currency preference and refresh interval settings
-- Affected tables: public.user_preferences
-- Author: Antigravity (Dev Agent)
-- Date: 2025-12-28

-- =============================================================================
-- Add settings columns to user_preferences
-- =============================================================================

-- Add currency column (default to USD)
alter table public.user_preferences 
  add column if not exists currency text not null default 'USD' 
  check (currency in ('USD', 'VND', 'EUR', 'GBP'));

-- Add refresh_interval column (default to 60 seconds)
alter table public.user_preferences 
  add column if not exists refresh_interval integer not null default 60 
  check (refresh_interval >= 10 and refresh_interval <= 300);

-- Add column comments
comment on column public.user_preferences.currency is 'User preferred base currency for portfolio display.';
comment on column public.user_preferences.refresh_interval is 'Dashboard auto-refresh interval in seconds (10-300).';

-- =============================================================================
-- Row Level Security (RLS) Note
-- =============================================================================
-- RLS is already enabled on user_preferences table (see migration 20251227000000)
-- Existing policies automatically apply to these new columns:
--   - "Users can view their own preferences" (SELECT)
--   - "Users can update their own preferences" (UPDATE)
--   - "Users can insert their own preferences" (INSERT)
-- No additional RLS policies needed for currency and refresh_interval columns.
