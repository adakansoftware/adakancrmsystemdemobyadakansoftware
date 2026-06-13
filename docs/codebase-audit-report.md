# Codebase Audit Report

Date: 2026-06-13

## Scope

This audit reflects the current CRM MVP after Prisma-backed reads, server actions,
auth, audit logging, and pipeline persistence were wired in. The review focuses on:

- duplicated components and repeated interaction patterns
- unnecessary state and weak UI state ownership
- folder structure and separation of concerns
- TypeScript typing quality
- component reusability
- accessibility and responsive behavior
- dead code and placeholder surfaces

## Current Strengths

- Main CRM routes now read from Prisma instead of fake arrays.
- Core create/update flows exist through server actions with validation and audit logging.
- Route protection, seeded auth, and pipeline movement persistence are working.
- `npm run verify` and smoke coverage are already part of the delivery workflow.

## Findings

### 1. Repeated interaction logic is still too copy-pasted

- Lead, deal, task, and settings screens each rebuild the same `Select` pattern.
- Success/error toast handling and `router.refresh()` logic is repeated in multiple client components.
- Per-row pending state is implemented separately in several list components with nearly identical code.

Impact:
This increases the chance of inconsistent behavior, inconsistent accessibility labels,
and regressions when one inline update flow is fixed but the others are not.

### 2. Some UI surfaces are still functionally thin

- `app/(app)/musteriler/page.tsx` and `app/(app)/firmalar/page.tsx` are real-data pages, but still read-only.
- `app/(app)/ayarlar/settings-client.tsx` still contains placeholder-ish UX such as a passive action button.
- `app/(app)/teklifler/page.tsx` remains intentionally out of scope and should stay clearly isolated from MVP expectations.

Impact:
The app feels partially operational rather than fully productized in the places users
expect to manage live CRM records.

### 3. TypeScript view-models are not centralized enough

- Page query functions build rich row objects, but the corresponding client components define their own inline types.
- Shared option types such as assignable users are repeated instead of coming from a common CRM view-model module.
- Several action return types are still broader than needed for client consumers.

Impact:
Type drift can happen quietly when server query shapes evolve.

### 4. Dead code still exists from the static demo phase

- `lib/data.ts` is no longer needed by the main app route set.
- The file still contains large fake arrays and corrupted strings, which now work against maintainability.

Impact:
It creates confusion about what is source-of-truth and makes the repo look less production-ready.

### 5. Accessibility and responsive polish still need hardening

- Inline selects do not consistently expose descriptive labels from a shared abstraction.
- The pipeline board supports pointer drag and drop, but not a keyboard alternative.
- Dense table screens still rely on hidden columns without shared compact-row fallbacks.

Impact:
The MVP is usable, but not yet consistently robust across assistive tech and narrow screens.

### 6. Text normalization remains unfinished

- Some files still contain mojibake-style corrupted Turkish text.
- This appears in labels, validation messages, and some supporting content.

Impact:
It damages perceived quality and can cause confusion in production UI.

## Priority Order

1. Remove dead demo data and centralize repeated CRM list interaction primitives.
2. Strengthen shared typing for row models and option lists.
3. Clean placeholder UX in settings and other half-wired screens.
4. Normalize corrupted UI strings.
5. Continue with company/contact update surfaces and notes/timeline presentation.

## Execution Notes

The next implementation pass should avoid redesign and focus on:

1. extracting reusable inline select controls and shared CRM row types
2. deleting unused static demo data
3. tightening settings behavior and other low-confidence surfaces
4. keeping verification green after every structural cleanup
