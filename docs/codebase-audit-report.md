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

## Current Strengths

- Main CRM pages, detail screens, and management dialogs now share common server-action UX primitives.
- Route protection, audit logging, seed-based auth, and pipeline persistence remain intact.
- `npm run verify` is part of the working loop and is green after the refactor pass.
- API routes now validate query input with Zod.
- Environment access is centralized through `lib/env.ts`.

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

## Remaining Risks

### 1. Rate limiting is still process-local by design

- `lib/security/rate-limit.ts` still uses in-memory storage.
- This is now documented clearly, but a shared backend such as Redis or KV would still be needed for multi-instance enforcement.

### 2. Some legacy/out-of-scope surfaces remain intentionally untouched

- `app/(app)/teklifler/page.tsx` is still a scoped workspace rather than a fully generalized product area.
- This is acceptable for the current MVP boundary, but it remains a deliberate product decision rather than a technical gap.

### 3. A deeper dead-code sweep could still be done

- The obvious unused shared action shim was removed.
- A broader “unused export / stale file” cleanup could still be run as a separate, lower-risk maintenance pass.

## Recommended Next Steps

1. Leave the current refactor state as the new baseline unless product scope changes.
2. If production traffic or multi-instance deployment is a priority, replace the in-memory rate limiter with a shared store.
3. If repo hygiene matters more than feature work next, run a dedicated dead-code and docs cleanup pass.
