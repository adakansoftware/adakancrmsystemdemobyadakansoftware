# Architecture & Layering

How the codebase is organized and the rules that keep it that way.
For the original backend foundations see [production-architecture.md](production-architecture.md).

## Layers

```
app/ (routes, server components)     read via lib/crm/queries, write via app/actions
app/actions/ (server actions)        validate with lib/validation, then call lib/crm
components/ (client components)      call server actions, never Prisma directly
lib/crm/queries/                     all reads: Prisma -> view-models
lib/crm/view-models.ts               serializable shapes for components
lib/validation/                      Zod schemas shared by actions and routes
lib/auth/                            session, RBAC, login rate limiting
lib/i18n/                            typed dictionaries + enum labels
lib/export/                          CSV export with formula-injection safety
lib/security/                        rate limit store abstraction
lib/db/prisma.ts                     singleton Prisma client
```

## Rules

1. **Reads go through `lib/crm/queries/`.** Pages and server components never
   call `db.*` directly. Each query module returns inferred types; string
   literal fields need `as const`.
2. **Writes go through server actions** (`app/actions/`). Every action parses
   its input with a Zod schema from `lib/validation/` before touching Prisma.
3. **Client components never import Prisma.** They receive view-models as
   props and mutate via server actions (`useServerActionToast`,
   `useOptimisticRowAction` wrap the common flows).
4. **Validation messages are i18n keys.** Zod error messages carry dictionary
   keys (`validation.*`); display sites translate them with
   `translateMessage(t, message)`, which passes unknown strings through
   unchanged.
5. **Auth is fail-closed.** `lib/env.ts` refuses to boot in production without
   `NEXTAUTH_SECRET`. RBAC checks live in `lib/auth/`; `sessionVersion`
   invalidates issued JWTs after sensitive changes.
6. **Soft delete over hard delete.** Seven models carry `archivedAt` plus a
   composite index; queries filter archived rows by default.

## i18n

- Dictionaries: `lib/i18n/dictionaries/tr.ts` (source of truth, ASCII-only
  Turkish) and `en.ts` (mirrors every key — missing keys are compile errors).
- `t(key, params)` interpolates `{param}` placeholders.
- Server side: `getI18n()` / `getLocale()` (React `cache`, cookie-based).
- Client side: `LocaleProvider` + `useI18n()` / `useEnumLabels()`.
- Locale cookie: `crm_locale`, toggled from the topbar.

## Testing

- `tests/unit/` — Vitest, node environment, V8 coverage over `lib/`.
- `tests/smoke.spec.ts` — Playwright browser suite against `npm run dev`
  (seeded credentials, overridable via `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`).
- `scripts/smoke-test.mjs` — HTTP smoke checks.
- `npm run verify` chains: prisma validate, lint, build, unit, smoke.
