# Codebase Audit Report

Date: 2026-06-12

## Scope

This audit covers the current Next.js CRM demo application with a focus on:

- duplicated components
- unnecessary state
- folder structure
- TypeScript typing
- component reusability
- accessibility
- responsiveness
- dead code

## Findings

### 1. Build and consistency issues

- `PageHeader` accepts `children`, but several pages pass an `action` prop instead.
- `app/(app)/teklifler/page.tsx` imports `components/ui/input-group`, but that file does not exist.
- Text content is affected by character encoding corruption across UI strings and demo data.

### 2. Duplicated UI patterns

- Search bars are rebuilt in multiple pages with the same icon/input structure.
- Summary cards are implemented in more than one style with overlapping behavior.
- Avatar initials are recalculated inline in several pages.
- Page-level filter rows and table wrappers repeat similar layout code.

### 3. Unnecessary or weakly modeled state

- `pipeline` copies static seed data into local state only to update stage values.
- Filter state in several pages is stored as generic `string` instead of domain-specific unions.
- Repeated inline derivations are not centralized, which makes state harder to reason about.

### 4. TypeScript gaps

- Page state and metadata mappings are partially typed, but not consistently derived from shared domain types.
- Reusable view-model helpers are missing for initials, option lists, and summary calculations.
- Some page implementations rely on values that should be constrained by shared literal unions.

### 5. Accessibility and responsiveness issues

- Clickable table rows are not keyboard-accessible.
- Pipeline drag and drop has no keyboard fallback or descriptive labeling.
- Some dense tables lack a clear small-screen fallback strategy.
- Several interactive elements have limited accessible text beyond icons.

### 6. Dead code and structural cleanup opportunities

- Some exports in `lib/data.ts` are not consumed by the current route set.
- Page-specific view logic lives directly inside route files, making reuse and maintenance harder.
- `components` currently mixes app shell, shared UI, and page-specific pieces at the same level.

## Refactor Plan

1. Fix compile-time inconsistencies without adding features.
2. Normalize corrupted Turkish strings.
3. Extract shared helpers and reusable page primitives.
4. Strengthen types for page state and shared metadata.
5. Improve keyboard/accessibility behavior where interaction already exists.
6. Remove unused code that is not referenced by the current app.
7. Reorganize folders conservatively to keep imports understandable.
