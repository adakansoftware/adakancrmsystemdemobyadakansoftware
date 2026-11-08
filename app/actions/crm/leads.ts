'use server'

import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import { deleteEntitySchema, leadSchema, updateLeadSchema } from '@/lib/validation/crm'
import { asDecimal, revalidateCrmPaths, successResult } from './shared'

export async function listLeads() {
  await requirePermission('leads:read')
  return db.lead.findMany({
    where: { archivedAt: null },
    include: { company: true, contact: true, owner: true, stage: true, pipeline: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const createLeadAction = createValidatedAction(leadSchema, async (input) => {
  const session = await requirePermission('leads:create')
  const lead = await db.lead.create({
    data: {
      ...input,
      estimatedValue: asDecimal(input.estimatedValue),
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      summary: `Lead created: ${lead.title}`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'SYSTEM',
      subject: `Lead created: ${lead.title}`,
      companyId: lead.companyId,
      contactId: lead.contactId,
      leadId: lead.id,
    }),
  ])

  revalidateCrmPaths()
  return lead
})

export const updateLeadAction = createValidatedAction(
  updateLeadSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('leads:update')
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...input,
        estimatedValue:
          input.estimatedValue === undefined
            ? undefined
            : asDecimal(input.estimatedValue),
      },
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Lead',
        entityId: lead.id,
        summary: `Lead updated: ${lead.title}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Lead updated: ${lead.title}`,
        companyId: lead.companyId,
        contactId: lead.contactId,
        leadId: lead.id,
      }),
    ])

    revalidateCrmPaths()
    return successResult(lead.id)
  },
)

export const deleteLeadAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('leads:delete')
    const lead = await db.lead.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Lead',
      entityId: lead.id,
      summary: `Lead archived: ${lead.title}`,
    })

    revalidateCrmPaths()
    return successResult(lead.id)
  },
)
