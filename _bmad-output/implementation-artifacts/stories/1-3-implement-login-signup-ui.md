# Story 1.3: Implement Login & Signup UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want a premium and accessible login/signup page,
so that I can enter the app with a sense of security and trust.

## Acceptance Criteria

1. **Premium Aesthetic:** UI must feel polished, with subtle glassmorphism, refined typography, and a "Consolidated Calm" color palette (neutrals with measured accents).
2. **Accessibility (WCAG 2.1 AA):** Forms must have proper labels, high-contrast text, clear focus states, and ARIA landmarks.
3. **Validation Feedback:** Real-time (or on-submit) validation errors (e.g., invalid email, weak password) must be displayed clearly with ARIA-live alerts.
4. **Motion & Transitions:** Use Framer Motion for smooth transitions (e.g., 200ms fade + slide) between login/signup states and for micro-interactions on inputs/buttons.
5. **Responsive Design:** UI must stack gracefully on mobile (≤640px) and maintain high-fidelity on desktop.
6. **Provider Clarity:** Clear distinction between Google OAuth and Email/Password options.

## Tasks / Subtasks

- [x] **Task 1: Enhance Auth Layout & Branding (AC: 1, 5)**
  - [x] Update `apps/web/src/routes/_auth.tsx` with a premium background (subtle gradient or mesh).
  - [x] Add branding/logo area with smooth entry animation.
  - [x] Ensure layout is responsive and centered for auth forms.

- [x] **Task 2: Implement Premium Login UI (AC: 1, 2, 3, 4, 6)**
  - [x] Refactor `apps/web/src/routes/_auth.login.tsx`.
  - [x] Enhance Google Sign-in button with branding and hover effects.
  - [x] Style Email/Password inputs with Radix UI focus states and clear labels.
  - [x] Add Framer Motion `AnimatePresence` for error message transitions.
  - [x] Implement focus-trapping or Tab order optimization if necessary.

- [x] **Task 3: Implement Premium Sign-up UI (AC: 1, 2, 3, 4, 6)**
  - [x] Refactor `apps/web/src/routes/_auth.sign-up.tsx` to match Login's aesthetic.
  - [x] Ensure validation logic is robust and accessible.

- [x] **Task 4: Shared Auth Components (AC: 1, 2)**
  - [x] Create/Update shared UI components in `@workspace/ui` or local `components/` if they need auth-specific styling (e.g., `AuthInput`, `SocialButton`).
  - [x] Implement "Calm" color tokens in Tailwind configuration for consistent use.

## Dev Notes

### Architecture & Specs

- **Framework:** React 19 (use `useActionState` if appropriate for loading/error management).
- **Styling:** Tailwind CSS 4.1.18. Use `zinc` for neutrals and `emerald` (measured) for success/primary actions.
- **Motion:** Framer Motion 12.23.26. Default transition: `200ms fade + 30px slide`.
- **Accessibility:** Radix UI Primitives (Slot, Label).
- **Icons:** Lucide React.

### Project Structure Notes

- Auth routes exist at `apps/web/src/routes/_auth.*.tsx`.
- Layout wrapper is `apps/web/src/routes/_auth.tsx`.
- Shared components should be placed in `apps/web/src/components/auth` or `@workspace/ui` if reusable across the monorepo.

### References

- [Source: _bmad-output/architecture.md#Frontend Architecture]
- [Source: _bmad-output/project-planning-artifacts/ux/ux-design-specification.md#Strategic Decisions]
- [Source: _bmad-output/project-planning-artifacts/ux/ux-design-specification.md#Responsive Behavior]

## Senior Developer Review (AI)

**Reviewer:** Claude 4 Sonnet (Code Review)
**Date:** 2025-12-26
**Outcome:** Approved (after fixes)

### Issues Found & Fixed

1. ✅ **[HIGH] AC#3 ARIA-live alerts** - Added `role="alert"`, `aria-live="polite"`, and `aria-atomic="true"` to error messages
2. ✅ **[HIGH] Password strength validation** - Added real-time password validation with visual strength indicator (min 8 chars, upper/lowercase, numbers)
3. ✅ **[HIGH] Server-side password validation** - Added minimum length check in action handler
4. ✅ **[MEDIUM] prefers-reduced-motion** - Added `useReducedMotion()` hook to all animated components
5. ✅ **[MEDIUM] Improved test coverage** - Expanded tests to 17 total, covering accessibility attributes, ARIA roles, keyboard navigation
6. ✅ **[MEDIUM] Glassmorphism styling** - Enhanced card styling with `bg-zinc-900/40`, `ring-1 ring-white/5`, `shadow-black/50`
7. ✅ **[MEDIUM] Semantic HTML** - Changed layout to use `<main>`, `<header>`, `<footer>` with proper ARIA roles
8. ✅ **[LOW] Removed noise.svg reference** - Replaced with CSS grid pattern that doesn't require external asset
9. ✅ **[LOW] Story status** - Updated to `done`

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Antigravity) → Claude 4 Sonnet (Code Review)

### Debug Log References

- Tests failed initially due to text matching issues, fixed by using `queryByText` and `getByRole`.
- Verified strictly typed `vitest` integration.
- Code review identified 10 issues, all fixed automatically.

### Completion Notes List

- Implemented premium "Consolidated Calm" aesthetic using `oklch` colors in `globals.css` and `framer-motion` for meaningful transitions.
- Enhanced `AuthLayout` with subtle background mesh and animated branding entry.
- Refactored `Login` and `SignUp` pages to use consistent, accessible forms with `lucide-react` icons and clear validation feedback.
- Added comprehensive unit tests (`_auth.login.test.tsx`, `_auth.sign-up.test.tsx`) covering rendering and basic interaction states using `vitest` and `@testing-library/react`.
- Configured `vitest` for the `apps/web` workspace.
- **Code Review Fixes:** Added ARIA-live alerts, password strength validation, useReducedMotion support, semantic HTML landmarks, enhanced glassmorphism styling.

### File List

- apps/web/src/routes/\_auth.tsx
- apps/web/src/routes/\_auth.login.tsx
- apps/web/src/routes/\_auth.sign-up.tsx
- apps/web/src/routes/\_auth.login.test.tsx
- apps/web/src/routes/\_auth.sign-up.test.tsx
- packages/ui/src/styles/globals.css
- apps/web/vitest.config.ts
- apps/web/test/setup.ts
- apps/web/package.json
