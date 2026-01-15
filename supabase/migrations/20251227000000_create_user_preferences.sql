-- Migration: Create user_preferences table
-- Purpose: Store user-specific settings and compliance data (Privacy Consent)
-- Affected tables: public.user_preferences
-- Author: Antigravity (Dev Agent)
-- Date: 2025-12-27

-- =============================================================================
-- Create the user_preferences table
-- =============================================================================
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  consent_granted boolean not null default false,
  consent_version text not null,
  consent_at timestamp with time zone default now() not null,
  audit_metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add table comment
comment on table public.user_preferences is 'Stores user-specific preferences and compliance data, including PDPA/GDPR privacy consent status.';

-- Add column comments
comment on column public.user_preferences.consent_granted is 'Whether the user has granted privacy consent.';
comment on column public.user_preferences.consent_version is 'The version of the privacy policy the user consented to.';
comment on column public.user_preferences.audit_metadata is 'JSONB field for audit trail (salted hash of IP/headers, user agent, locale) to ensure compliance without storing PII in plain text.';

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================
alter table public.user_preferences enable row level security;

-- =============================================================================
-- RLS Policies
-- =============================================================================
-- Policy: Users can view their own preferences
create policy "Users can view their own preferences"
  on public.user_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: Users can update their own preferences
create policy "Users can update their own preferences"
  on public.user_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: System can insert user preferences
create policy "Users can insert their own preferences"
  on public.user_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function public.handle_updated_at();
