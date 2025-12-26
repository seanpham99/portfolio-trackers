# Story 1.2: Configure Supabase Auth & Google OAuth

Status: done

## Story

As a User,
I want to authenticate via Google OAuth or Email/Password,
so that I can securely access my portfolio data.

## Acceptance Criteria

1. **Given** a Supabase project
2. **When** I configure Google OAuth and Email/Password providers in the Supabase dashboard
3. **Then** a user should be able to sign up or log in using either method
4. **And** the user's profile should be automatically created in the `public.users` table upon first login (via Database Trigger)
5. **And** a secure JWT should be returned to the client.

## Tasks / Subtasks

- [x] **Task 1: Add Type Generation Script (Prerequisite)**
  - [x] Add `db:gen-types` script to root `package.json`.
  - [x] Ensure `packages/database-types/src/index.ts` exports from `supabase-types.ts`.
  - [x] Created placeholder `supabase-types.ts` file.

- [x] **Task 2: Create Initial Users Migration (AC: 4)**
  - [x] Created `supabase/migrations/20251226140000_create_users_table.sql`.
  - [x] Followed `.cursor/rules/create-migration.mdc` and `postgres-sql-style-guide.mdc`.
  - [x] Table: `public.users` (id uuid references auth.users, email, full_name, avatar_url, created_at, updated_at).
  - [x] Enabled RLS on `public.users`.

- [x] **Task 3: Create User-Profile Trigger (AC: 4)**
  - [x] Created trigger function `public.handle_new_user()` in the same migration.
  - [x] Created trigger `on_auth_user_created` on `auth.users`.
  - [x] Auto-captures Google avatar from `raw_user_meta_data->>'picture'`.

- [x] **Task 4: Add RLS Policies (AC: 5)**
  - [x] Followed `.cursor/rules/create-rls-policies.mdc`.
  - [x] Policy: "Users can view their own profile" (select).
  - [x] Policy: "Users can update their own profile" (update).
  - [x] Policy: "System can insert user profiles" (insert).
  - [x] **Note:** Delete policy intentionally omitted to prevent zombie account state.

- [x] **Task 5: Configure Supabase Auth Providers (AC: 1, 2)**
  - [x] Updated `supabase/config.toml` with Google OAuth settings.
  - [x] Configured `site_url` and `additional_redirect_urls`.
  - [x] Email/Password provider enabled by default.

- [x] **Task 6: Implement Auth Routes with Google OAuth (AC: 3)**
  - [x] Created `apps/web/src/routes/_auth.oauth.tsx` - OAuth callback handler.
  - [x] Updated `apps/web/src/routes/_auth.login.tsx` - Added "Continue with Google" button.
  - [x] Updated `apps/web/src/routes/_auth.sign-up.tsx` - Added "Sign up with Google" button.
  - [x] Both pages support intent-based actions for Google vs Email/Password.

- [x] **Task 7: Integrate Database Types**
  - [x] User ran `pnpm db:gen-types` - types generated.
  - [x] Updated `apps/web/src/lib/supabase/client.ts` with `Database` type.
  - [x] Updated `apps/web/src/lib/supabase/server.ts` with `Database` type.
  - [x] Added `@repo/database-types` dependency to `apps/web/package.json`.

## Dev Notes

### Schema Design Decisions
- **No `username` or `website` fields**: Not needed for MVP. Can be added later via migration.
- **No delete policy**: Prevents users from deleting their profile while keeping their auth account (zombie state).
- **Google avatar auto-captured**: Trigger extracts `picture` from Google's user metadata.

### SQL Style Guide (Mandatory)
- Use **lowercase** for all SQL.
- Use **snake_case** for tables and columns.
- All tables in `public` schema MUST have RLS enabled.
- Separate RLS policies per operation (`select`, `insert`, `update`).
- Wrap `auth.uid()` with `select` for performance: `(select auth.uid())`.

### Auth Routes Structure
- `apps/web/src/routes/_auth.tsx` - Layout wrapper
- `apps/web/src/routes/_auth.login.tsx` - Login page (Google + Email)
- `apps/web/src/routes/_auth.sign-up.tsx` - Sign-up page (Google + Email)
- `apps/web/src/routes/_auth.oauth.tsx` - OAuth callback handler
- `apps/web/src/routes/auth.confirm.tsx` - Email OTP verification
- `apps/web/src/routes/auth.error.tsx` - Error display page
- `apps/web/src/routes/logout.tsx` - Logout action

### Type Generation Flow
```
supabase db push → pnpm db:gen-types → packages/database-types/src/supabase-types.ts
```

### References
- [Source: .cursor/rules/create-migration.mdc]
- [Source: .cursor/rules/create-rls-policies.mdc]
- [External: Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Dev Agent Record

### Agent Model Used
Claude 3.5 Sonnet (Amelia)

### Code Review
- **Reviewer:** Claude 3.5 Sonnet (different model instance)
- **Date:** 2025-12-26
- **Issues Found:** 1 High (untracked file), 1 Medium (zombie risk)
- **Resolution:** HIGH fixed (git add), MEDIUM fixed (delete policy removed)

### Verification
- ✅ Google OAuth tested and working on dev server

### File List
- `package.json` (modified - added db:gen-types script)
- `packages/database-types/src/index.ts` (modified)
- `packages/database-types/src/supabase-types.ts` (created/regenerated)
- `supabase/migrations/20251226140000_create_users_table.sql` (created)
- `supabase/config.toml` (modified - Google OAuth)
- `apps/web/src/routes/_auth.oauth.tsx` (created)
- `apps/web/src/routes/_auth.login.tsx` (modified - Google OAuth)
- `apps/web/src/routes/_auth.sign-up.tsx` (modified - Google OAuth)
- `apps/web/src/lib/supabase/client.ts` (modified - Database type)
- `apps/web/src/lib/supabase/server.ts` (modified - Database type)
- `apps/web/package.json` (modified - @repo/database-types dep)
