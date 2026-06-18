# Codebase Audit Report

Date: 2026-06-18

## Scope

This document reflects the post-refactor CRM codebase after the hardening pass focused on:

- repeated interaction patterns and client state ownership
- TypeScript centralization
- validation and environment handling
- soft-delete and data-access safety
- accessibility without visual redesign
- dead code and text consistency
- production auth and export hardening

## Current Strengths

- Main CRM pages, detail screens, and management dialogs now share common server-action UX primitives.
- Route protection, audit logging, seed-based auth, and pipeline persistence remain intact.
- `npm run verify` is part of the working loop and is green after the refactor pass.
- API routes now validate query input with Zod.
- Environment access is centralized through `lib/env.ts`.
- User-management responses are now intentionally narrowed before they leave auth-related server actions.

## Closed Findings

### 1. Repeated interaction logic was centralized

- Shared `useServerActionToast` and `useOptimisticRowAction` hooks now handle success/error toasts, pending state, and refresh behavior.
- Lead, deal, task, settings, company, contact, and detail update surfaces no longer duplicate the same inline async control flow.
- Inline select usage remains visually unchanged while accessibility labels stay explicit.

### 2. Type centralization improved materially

- Shared query result types are now derived from server query functions in `lib/crm/queries.ts`.
- Settings page props were moved into a dedicated CRM view-model module.
- Client components no longer need as many repeated inline row and option type declarations.

### 3. Validation and env handling were standardized

- API route query parsing is now validated in `lib/validation/api.ts`.
- Environment variable access is centralized in `lib/env.ts`.
- Shared action helpers now expose reusable validation error typing for client-side action wrappers.

### 4. Accessibility improved without UI redesign

- Pipeline board now supports keyboard stage movement.
- Existing inline select controls consistently receive descriptive ARIA labels through shared call sites.

### 5. Soft-delete safety improved

- Detail query lookups for company, contact, and deal records now respect `archivedAt: null`.
- Additional Prisma indexes were added for common archived/status/ownership filter combinations.

### 6. Production auth now fails closed

- `lib/env.ts` no longer ships a static fallback session secret.
- Production runtime now refuses to boot without `NEXTAUTH_SECRET`, `AUTH_SECRET`, or `SESSION_SECRET`.
- Development and test environments use a per-process runtime secret instead of a committed string literal.

### 7. Password hashes are no longer exposed to client-facing auth flows

- Prisma now omits `user.passwordHash` by default at the client layer.
- The few server-only paths that must verify passwords explicitly opt back in.
- User and role-management actions now return narrowed response payloads that exclude sensitive fields by type and by runtime shape.

### 8. Login rate limiting and session policy are more consistent

- Rate limiting is now enforced inside `Credentials.authorize`, which covers both the form action path and direct requests to the NextAuth credentials callback.
- Login throttling now applies both per-IP and per-IP-plus-email keys.
- Session `maxAge` and cookie lifetime now align with the intended 7-day policy.

### 9. Export route permissions and CSV safety were hardened

- `/api/export` now enforces entity-specific read permissions before returning data.
- CSV export now neutralizes formula-style cell prefixes to reduce spreadsheet injection risk.
- Export permission mapping and CSV escaping are covered by unit regression checks.

### 10. Password policy and login flow were tightened

- Setup, password change, and user creation now require passwords with uppercase, lowercase, and numeric characters.
- Login validation still accepts existing legacy passwords so older accounts are not locked out unexpectedly.
- `loginFormAction` no longer repeats the same credential lookup and bcrypt compare that already happen inside `Credentials.authorize`.

## Remaining Risks

### 1. Rate limiting is still process-local by design

- `lib/security/rate-limit.ts` still uses in-memory storage.
- This is now documented clearly, but a shared backend such as Redis or KV would still be needed for multi-instance enforcement.

### 2. Audit logs still miss request IP and User-Agent

- `AuditLog` does not yet persist request IP or User-Agent for login/logout and privileged management events.
- This lowers forensic value during account-abuse investigations and is still worth a schema-level follow-up.

### 3. Some legacy/out-of-scope surfaces remain intentionally untouched

- `app/(app)/teklifler/page.tsx` is still a scoped workspace rather than a fully generalized product area.
- This is acceptable for the current MVP boundary, but it remains a deliberate product decision rather than a technical gap.

## Recommended Next Steps

1. If production traffic or multi-instance deployment is a priority, replace the in-memory rate limiter with a shared store.
2. Add request IP and User-Agent capture to `AuditLog` for authentication and privileged actions.
3. Leave the new password policy and auth hardening as the baseline unless migration requirements for legacy users change.
