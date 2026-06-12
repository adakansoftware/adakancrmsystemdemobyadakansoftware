'use server'

import { Prisma } from '@prisma/client'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity, getActivitiesTimeline } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import {
  companySchema,
  contactSchema,
  dealSchema,
  deleteEntitySchema,
  leadSchema,
  noteSchema,
  timelineFilterSchema,
  updateCompanySchema,
  updateContactSchema,
  updateDealSchema,
  updateLeadSchema,
  updateNoteSchema,
} from '@/lib/validation/crm'

function asDecimal(value: number | null | undefined) {
  return value == null ? null : new Prisma.Decimal(value)
}

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

    return company
  },
)

export async function listContacts() {
  await requirePermission('contacts:read')
  return db.contact.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { company: true },
  })
}

export const createContactAction = createValidatedAction(
  contactSchema,
  async (input) => {
    const session = await requirePermission('contacts:create')
    const contact = await db.contact.create({
      data: input,
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'CREATE',
        entityType: 'Contact',
        entityId: contact.id,
        summary: `Contact created: ${contact.firstName} ${contact.lastName}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'SYSTEM',
        subject: `Contact created: ${contact.firstName} ${contact.lastName}`,
        companyId: contact.companyId,
        contactId: contact.id,
      }),
    ])

    return contact
  },
)

export const updateContactAction = createValidatedAction(
  updateContactSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('contacts:update')
    const contact = await db.contact.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Contact',
      entityId: contact.id,
      summary: `Contact updated: ${contact.firstName} ${contact.lastName}`,
    })

    return contact
  },
)

export const deleteContactAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('contacts:delete')
    const contact = await db.contact.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Contact',
      entityId: contact.id,
      summary: `Contact archived: ${contact.firstName} ${contact.lastName}`,
    })

    return contact
  },
)

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

    return lead
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

    return lead
  },
)

export async function listDeals() {
  await requirePermission('deals:read')
  return db.deal.findMany({
    where: { archivedAt: null },
    include: { company: true, contact: true, owner: true, stage: true, pipeline: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const createDealAction = createValidatedAction(dealSchema, async (input) => {
  const session = await requirePermission('deals:create')
  const deal = await db.deal.create({
    data: {
      ...input,
      amount: new Prisma.Decimal(input.amount),
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Deal',
      entityId: deal.id,
      summary: `Deal created: ${deal.title}`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'SYSTEM',
      subject: `Deal created: ${deal.title}`,
      companyId: deal.companyId,
      contactId: deal.contactId,
      dealId: deal.id,
    }),
  ])

  return deal
})

export const updateDealAction = createValidatedAction(
  updateDealSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('deals:update')
    const deal = await db.deal.update({
      where: { id },
      data: {
        ...input,
        amount:
          input.amount === undefined ? undefined : new Prisma.Decimal(input.amount),
      },
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Deal',
        entityId: deal.id,
        summary: `Deal updated: ${deal.title}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STAGE_CHANGE',
        subject: `Deal updated: ${deal.title}`,
        companyId: deal.companyId,
        contactId: deal.contactId,
        dealId: deal.id,
      }),
    ])

    return deal
  },
)

export const deleteDealAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('deals:delete')
    const deal = await db.deal.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Deal',
      entityId: deal.id,
      summary: `Deal archived: ${deal.title}`,
    })

    return deal
  },
)

export async function listNotes(filters: {
  companyId?: string
  contactId?: string
  leadId?: string
  dealId?: string
  taskId?: string
}) {
  await requirePermission('notes:read')
  return db.note.findMany({
    where: filters,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })
}

export const createNoteAction = createValidatedAction(noteSchema, async (input) => {
  const session = await requirePermission('notes:create')
  const note = await db.note.create({
    data: {
      ...input,
      authorId: session.userId,
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note created`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'NOTE',
      subject: input.title?.trim() || 'Note added',
      description: note.body,
      companyId: note.companyId,
      contactId: note.contactId,
      leadId: note.leadId,
      dealId: note.dealId,
      taskId: note.taskId,
    }),
  ])

  return note
})

export const updateNoteAction = createValidatedAction(
  updateNoteSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('notes:update')
    const note = await db.note.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note updated`,
    })

    return note
  },
)

export const deleteNoteAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('notes:delete')
    const note = await db.note.delete({
      where: { id },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note deleted`,
    })

    return { id: note.id }
  },
)

export const getTimelineAction = createValidatedAction(
  timelineFilterSchema,
  async (input) => {
    await requirePermission('activities:read')
    return getActivitiesTimeline(input)
  },
)
