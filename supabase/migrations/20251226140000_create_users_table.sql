-- Migration: Create users table
-- Purpose: Store user profile data linked to auth.users
-- Affected tables: public.users
-- Author: Amelia (Dev Agent)
-- Date: 2025-12-26

-- =============================================================================
-- Create the users table
-- =============================================================================
-- This table stores user profile information that extends auth.users.
-- The id column references auth.users.id to maintain referential integrity.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add table comment
comment on table public.users is 'User profile data extending auth.users. Each row corresponds to an authenticated user.';

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================
-- RLS is mandatory for all tables in the public schema.
alter table public.users enable row level security;

-- =============================================================================
-- RLS Policies
-- =============================================================================
-- Following best practices from .cursor/rules/create-rls-policies.mdc:
-- - Separate policies per operation (select, insert, update, delete)
-- - Use (select auth.uid()) for performance optimization
-- - Specify roles explicitly (authenticated, anon)

-- Policy: Users can view their own profile
create policy "Users can view their own profile"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Policy: System can insert user profiles (triggered by auth.users insert)
-- This allows the trigger function to create profiles for new users.
create policy "System can insert user profiles"
  on public.users
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- =============================================================================
-- Create trigger function for auto-creating user profiles
-- =============================================================================
-- This function runs after a new user signs up via auth.users.
-- It copies essential data to public.users for easier querying.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

-- Add function comment
comment on function public.handle_new_user() is 'Trigger function to create a public.users row when a new auth.users row is inserted.';

-- =============================================================================
-- Create trigger on auth.users
-- =============================================================================
-- This trigger fires after a new user is inserted into auth.users.

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
