# Production Architecture Notes

This repo now includes a backend-oriented CRM data architecture built for:

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Server Actions

## Added foundations

- `prisma/schema.prisma`
  Defines the CRM relational model and indexes for:
  - Users
  - Roles
  - Companies
  - Contacts
  - Leads
  - Deals
  - Tasks
  - Activities
  - Notes
  - Pipelines
  - Stages

- `lib/db/prisma.ts`
  Singleton Prisma client for App Router server usage.

- `lib/validation/crm.ts`
  Zod schemas aligned with the database entities for future Server Actions.

- `lib/actions/create-validated-action.ts`
  Generic validation wrapper intended for future Server Actions.

- `.env.example`
  PostgreSQL and Neon-compatible connection placeholders.

## Design choices

- PostgreSQL is modeled as the source of truth through Prisma.
- Pipelines and stages are normalized and reusable through explicit relations.
- Leads and deals both reference pipeline and stage, making stage transitions queryable.
- Notes and activities support attaching to CRM records without forcing a single target type.
- Join table `UserRole` supports many-to-many authorization growth without hardcoding role enums.
- Core operational tables include timestamps and archive fields for safer production lifecycle handling.

## Next logical step

When you are ready to connect Neon, the only required runtime step is setting:

- `DATABASE_URL`
- `DIRECT_URL`

Then run:

```bash
npm run prisma:generate
npm run prisma:validate
npm run db:push
```
