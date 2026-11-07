# Codebase Audit Report

Date: 2026-06-18 (initial hardening pass), 2026-11-07 (second hardening pass, see "Second Hardening Pass" at the end)

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

### 11. Rate limiter and audit forensics were finished

- Login throttling now defaults to a shared PostgreSQL-backed store, so limits remain effective across multiple app instances that share the same database.
- `RATE_LIMIT_STORE=memory` is still available as an explicit local-development fallback instead of being the implicit production behavior.
- `AuditLog` now persists request IP and User-Agent metadata, and the admin screen surfaces those details in recent audit entries.

## Remaining Risks

### 1. Some legacy/out-of-scope surfaces remain intentionally untouched

- `app/(app)/teklifler/page.tsx` is still a scoped workspace rather than a fully generalized product area.
- This is acceptable for the current MVP boundary, but it remains a deliberate product decision rather than a technical gap.

## Recommended Next Steps

1. Leave the PostgreSQL-backed limiter and audit metadata capture as the new operational baseline.
2. If traffic patterns outgrow database-backed throttling, move the limiter to Redis or KV without changing the auth call sites.
3. Leave the new password policy and auth hardening as the baseline unless migration requirements for legacy users change.

## Second Hardening Pass

Date: 2026-11-07

### Closed findings

#### 1. RBAC permission gaps for tasks, activities, and tags

- Added dedicated `tasks:read`, `tasks:create`, `tasks:update`, `activities:create`, and `tags:manage` permissions to the role matrix.
- `createTaskAction`, `updateTaskAction`, and `listTasks` now require task permissions instead of reusing `activities:read`; a readonly user can no longer create or mutate tasks.
- `createActivityAction` now requires `activities:create` instead of read access.
- Tag CRUD now requires `tags:manage` (owner and manager) instead of the unrelated `companies:update`.
- Role matrix: owner keeps all permissions; manager and staff gain task CRUD, activity creation, and (manager only) tag management; readonly gains `tasks:read` only.

#### 2. JWT sessions are now invalidated by server-side state changes

- `User.sessionVersion` was added to the Prisma schema (default 0) and is embedded in the JWT at sign-in.
- `getCurrentSession` verifies the token's version against the database on every request (React-cached per request) and rejects the session on mismatch, on `SUSPENDED`, or on `ARCHIVED` status. This check deliberately lives outside the middleware/jwt callback so the edge middleware stays database-free.
- `sessionVersion` is incremented on password change, user suspension/archival, and role assignment/removal, so password changes and role changes now revoke outstanding tokens instead of staying valid until cookie expiry.

#### 3. Global search respects entity permissions

- `/api/search` now computes the caller's entity read permissions and passes an entity filter into `searchCrmRecords`, consistent with the per-entity checks already enforced by `/api/export`.

#### 4. Client error surface no longer leaks internal errors

- `useServerActionToast` now suppresses technical error messages (Prisma query internals, `Forbidden:` details, framework digests) and falls back to the caller-provided error message. Deliberately user-facing messages thrown by server actions are still shown.

#### 5. Rate limiter fallback failures are no longer silent

- `checkRateLimit`/`clearRateLimit` log primary-store failures before falling back to the in-memory store. Documented limitation: counters can split across stores mid-window, so the effective limit can temporarily reach up to 2x during a database outage.

#### 6. Admin session metric now reflects reality

- The `Session` table is not populated by JWT-strategy logins, so the previous "Aktif Oturum" card counted adapter rows that never matched runtime sessions. It now reports users that signed in during the last 24 hours (`lastLoginAt`-based).

### Verification

- `npm run verify` (prisma validate, lint, build, unit checks, smoke checks) passes.
- Full Playwright browser suite passes (a pre-existing strict-mode selector collision in the customer detail test was fixed with `{ exact: true }`).
- Schema change pushed with `prisma db push`; the `sessionVersion` column is additive and defaults to 0.
