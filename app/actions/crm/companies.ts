'use server'

import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import { companySchema, deleteEntitySchema, updateCompanySchema } from '@/lib/validation/crm'
import { revalidateCrmPaths } from './shared'

export async function listCompanies() {
  await requirePermission('companies:read')
  return db.company.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export const createCompanyAction = createValidatedAction(
  companySchema,
  async (input) => {
    const session = await requirePermission('companies:create')
    const company = await db.company.create({
      data: input,
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'CREATE',
        entityType: 'Company',
        entityId: company.id,
        summary: `Company created: ${company.name}`,
        metadata: { companyId: company.id },
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'SYSTEM',
        subject: `Company created: ${company.name}`,
        companyId: company.id,
      }),
    ])

    revalidateCrmPaths()
    return company
  },
)

export const updateCompanyAction = createValidatedAction(
  updateCompanySchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('companies:update')
    const company = await db.company.update({
      where: { id },
      data: input,
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Company',
        entityId: company.id,
        summary: `Company updated: ${company.name}`,
        metadata: { companyId: company.id },
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Company updated: ${company.name}`,
        companyId: company.id,
      }),
    ])

    revalidateCrmPaths()
    return company
  },
)

export const deleteCompanyAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('companies:delete')
    const company = await db.company.update({
      where: { id },
      data: { archivedAt: new Date(), status: 'ARCHIVED' },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Company',
      entityId: company.id,
      summary: `Company archived: ${company.name}`,
    })

    revalidateCrmPaths()
    return company
  },
)
