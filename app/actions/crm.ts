'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity, getActivitiesTimeline } from '@/lib/crm/activity'
import {
  ensureDefaultDealPipeline,
} from '@/lib/crm/bootstrap'
import {
  createDealStageHistory,
  createDealValueHistory,
  getDealPipelineBoard,
} from '@/lib/crm/pipeline'
import { db } from '@/lib/db/prisma'
import {
  activitySchema,
  companySchema,
  contactSchema,
  dealSchema,
  deleteEntitySchema,
  leadSchema,
  noteSchema,
  moveDealSchema,
  pipelineQuerySchema,
  pipelineSchema,
  stageSchema,
  taskSchema,
  trackDealValueSchema,
  timelineFilterSchema,
  updateCompanySchema,
  updateContactSchema,
  updateDealSchema,
  updateLeadSchema,
  updateNoteSchema,
  updatePipelineSchema,
  updateStageSchema,
  updateTaskSchema,
} from '@/lib/validation/crm'

function asDecimal(value: number | null | undefined) {
  return value == null ? null : new Prisma.Decimal(value)
}

function successResult(id: string) {
  return { id }
}

function revalidateCrmPaths() {
  for (const path of [
    '/',
    '/musteriler',
    '/firmalar',
    '/leads',
    '/anlasmalar',
    '/pipeline',
    '/gorevler',
    '/takvim',
  ]) {
    revalidatePath(path)
  }
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

    revalidateCrmPaths()
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

    revalidateCrmPaths()
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

    revalidateCrmPaths()
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

export async function listDeals() {
  await requirePermission('deals:read')
  return db.deal.findMany({
    where: { archivedAt: null },
    include: {
      company: true,
      contact: true,
      owner: true,
      stage: true,
      pipeline: true,
      stageHistory: {
        orderBy: { movedAt: 'desc' },
        take: 20,
      },
      valueHistory: {
        orderBy: { changedAt: 'desc' },
        take: 20,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const createDealAction = createValidatedAction(dealSchema, async (input) => {
  const session = await requirePermission('deals:create')
  await ensureDefaultDealPipeline(session.userId)
  const amount = new Prisma.Decimal(input.amount)
  const deal = await db.deal.create({
    data: {
      ...input,
      amount,
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
    createDealStageHistory({
      dealId: deal.id,
      actorId: session.userId,
      toPipelineId: deal.pipelineId,
      toStageId: deal.stageId,
      amountSnapshot: amount,
      currency: deal.currency,
      note: 'Initial pipeline placement',
    }),
    createDealValueHistory({
      dealId: deal.id,
      actorId: session.userId,
      newValue: amount,
      currency: deal.currency,
      reason: 'Initial deal value',
    }),
  ])

  revalidateCrmPaths()
  return successResult(deal.id)
})

export const updateDealAction = createValidatedAction(
  updateDealSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('deals:update')
    const existingDeal = await db.deal.findUniqueOrThrow({
      where: { id },
      include: { stage: true },
    })

    const nextAmount =
      input.amount === undefined ? existingDeal.amount : new Prisma.Decimal(input.amount)
    const deal = await db.deal.update({
      where: { id },
      data: {
        ...input,
        amount: input.amount === undefined ? undefined : nextAmount,
      },
      include: {
        stage: true,
      },
    })

    const timelineTasks: Promise<unknown>[] = []

    if (
      input.amount !== undefined &&
      !existingDeal.amount.equals(nextAmount)
    ) {
      timelineTasks.push(
        createDealValueHistory({
          dealId: deal.id,
          actorId: session.userId,
          previousValue: existingDeal.amount,
          newValue: nextAmount,
          currency: deal.currency,
          reason: input.lostReason ?? 'Deal value updated',
        }),
      )
    }

    if (
      (input.stageId && input.stageId !== existingDeal.stageId) ||
      (input.pipelineId && input.pipelineId !== existingDeal.pipelineId)
    ) {
      timelineTasks.push(
        createDealStageHistory({
          dealId: deal.id,
          actorId: session.userId,
          fromPipelineId: existingDeal.pipelineId,
          toPipelineId: deal.pipelineId,
          fromStageId: existingDeal.stageId,
          toStageId: deal.stageId,
          amountSnapshot: deal.amount,
          currency: deal.currency,
          note: 'Deal stage updated',
        }),
      )
    }

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
      ...timelineTasks,
    ])

    revalidateCrmPaths()
    return successResult(deal.id)
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

    revalidateCrmPaths()
    return successResult(deal.id)
  },
)

export async function listTasks() {
  await requirePermission('activities:read')
  return db.task.findMany({
    where: { archivedAt: null },
    include: {
      assignee: true,
      company: true,
      contact: true,
      lead: true,
      deal: true,
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  })
}

export const createTaskAction = createValidatedAction(taskSchema, async (input) => {
  const session = await requirePermission('activities:read')
  const task = await db.task.create({
    data: {
      ...input,
      creatorId: session.userId,
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task.id,
      summary: `Task created: ${task.title}`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'TASK',
      subject: `Task created: ${task.title}`,
      companyId: task.companyId,
      contactId: task.contactId,
      leadId: task.leadId,
      dealId: task.dealId,
      taskId: task.id,
    }),
  ])

  revalidateCrmPaths()
  return task
})

export const updateTaskAction = createValidatedAction(
  updateTaskSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('activities:read')
    const task = await db.task.update({
      where: { id },
      data: {
        ...input,
        completedAt:
          input.status == null
            ? undefined
            : input.status === 'DONE'
              ? new Date()
              : null,
      },
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Task',
        entityId: task.id,
        summary: `Task updated: ${task.title}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Task updated: ${task.title}`,
        companyId: task.companyId,
        contactId: task.contactId,
        leadId: task.leadId,
        dealId: task.dealId,
        taskId: task.id,
      }),
    ])

    revalidateCrmPaths()
    return task
  },
)

export const createActivityAction = createValidatedAction(
  activitySchema,
  async (input) => {
    const session = await requirePermission('activities:read')
    const activity = await db.activity.create({
      data: {
        actorId: input.actorId ?? session.userId,
        companyId: input.companyId ?? null,
        contactId: input.contactId ?? null,
        leadId: input.leadId ?? null,
        dealId: input.dealId ?? null,
        taskId: input.taskId ?? null,
        type: input.type,
        subject: input.subject,
        description: input.description ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        occurredAt: input.occurredAt,
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Activity',
      entityId: activity.id,
      summary: `Activity created: ${activity.subject}`,
    })

    revalidateCrmPaths()
    return activity
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

  revalidateCrmPaths()
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

    revalidateCrmPaths()
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

    revalidateCrmPaths()
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

export async function listDealPipelines() {
  await requirePermission('deals:read')
  await ensureDefaultDealPipeline()

  return db.pipeline.findMany({
    where: {
      entityType: 'DEAL',
      archivedAt: null,
    },
    include: {
      stages: {
        orderBy: { position: 'asc' },
      },
      _count: {
        select: {
          deals: true,
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
}

export const getDealPipelineBoardAction = createValidatedAction(
  pipelineQuerySchema,
  async (input) => {
    await requirePermission('deals:read')
    await ensureDefaultDealPipeline()
    return getDealPipelineBoard(input.pipelineId ?? null)
  },
)

export const createPipelineAction = createValidatedAction(
  pipelineSchema,
  async (input) => {
    const session = await requirePermission('deals:update')
    const pipeline = await db.pipeline.create({
      data: {
        ...input,
        createdById: session.userId,
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Pipeline',
      entityId: pipeline.id,
      summary: `Pipeline created: ${pipeline.name}`,
    })

    revalidateCrmPaths()
    return pipeline
  },
)

export const updatePipelineAction = createValidatedAction(
  updatePipelineSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('deals:update')
    const pipeline = await db.pipeline.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Pipeline',
      entityId: pipeline.id,
      summary: `Pipeline updated: ${pipeline.name}`,
    })

    revalidateCrmPaths()
    return pipeline
  },
)

export const createStageAction = createValidatedAction(
  stageSchema,
  async (input) => {
    const session = await requirePermission('deals:update')
    const stage = await db.stage.create({
      data: {
        ...input,
        createdById: session.userId,
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Stage',
      entityId: stage.id,
      summary: `Stage created: ${stage.name}`,
    })

    revalidateCrmPaths()
    return stage
  },
)

export const updateStageAction = createValidatedAction(
  updateStageSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('deals:update')
    const stage = await db.stage.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Stage',
      entityId: stage.id,
      summary: `Stage updated: ${stage.name}`,
    })

    revalidateCrmPaths()
    return stage
  },
)

export const moveDealToStageAction = createValidatedAction(
  moveDealSchema,
  async ({ dealId, toPipelineId, toStageId, note }) => {
    const session = await requirePermission('deals:update')
    const existingDeal = await db.deal.findUniqueOrThrow({
      where: { id: dealId },
      include: { stage: true },
    })
    const targetStage = await db.stage.findUniqueOrThrow({
      where: { id: toStageId },
    })

    if (targetStage.pipelineId !== toPipelineId) {
      throw new Error('Stage does not belong to the selected pipeline')
    }

    const nextStatus = targetStage.isClosed
      ? targetStage.isWon
        ? 'WON'
        : 'LOST'
      : 'OPEN'

    const deal = await db.deal.update({
      where: { id: dealId },
      data: {
        pipelineId: toPipelineId,
        stageId: toStageId,
        probability: targetStage.probability,
        status: nextStatus,
        closedAt: targetStage.isClosed ? new Date() : null,
        wonAt: targetStage.isClosed && targetStage.isWon ? new Date() : null,
        lostAt: targetStage.isClosed && !targetStage.isWon ? new Date() : null,
      },
    })

    await Promise.all([
      createDealStageHistory({
        dealId: deal.id,
        actorId: session.userId,
        fromPipelineId: existingDeal.pipelineId,
        toPipelineId,
        fromStageId: existingDeal.stageId,
        toStageId,
        amountSnapshot: deal.amount,
        currency: deal.currency,
        note: note ?? 'Deal moved in pipeline',
      }),
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Deal',
        entityId: deal.id,
        summary: `Deal moved to stage ${targetStage.name}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STAGE_CHANGE',
        subject: `Deal moved to ${targetStage.name}`,
        companyId: deal.companyId,
        contactId: deal.contactId,
        dealId: deal.id,
        description: note ?? undefined,
      }),
    ])

    revalidateCrmPaths()
    return successResult(deal.id)
  },
)

export const trackDealValueAction = createValidatedAction(
  trackDealValueSchema,
  async ({ dealId, amount, reason }) => {
    const session = await requirePermission('deals:update')
    const existingDeal = await db.deal.findUniqueOrThrow({
      where: { id: dealId },
    })
    const nextAmount = new Prisma.Decimal(amount)

    if (existingDeal.amount.equals(nextAmount)) {
      return existingDeal
    }

    const deal = await db.deal.update({
      where: { id: dealId },
      data: {
        amount: nextAmount,
      },
    })

    await Promise.all([
      createDealValueHistory({
        dealId: deal.id,
        actorId: session.userId,
        previousValue: existingDeal.amount,
        newValue: nextAmount,
        currency: deal.currency,
        reason: reason ?? 'Manual deal value tracking',
      }),
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Deal',
        entityId: deal.id,
        summary: `Deal value updated: ${deal.title}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Deal value updated`,
        companyId: deal.companyId,
        contactId: deal.contactId,
        dealId: deal.id,
        description: reason ?? undefined,
      }),
    ])

    revalidateCrmPaths()
    return deal
  },
)

export async function getDealMovementHistory(dealId: string) {
  await requirePermission('deals:read')
  return db.dealStageHistory.findMany({
    where: { dealId },
    include: {
      actor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      fromStage: true,
      toStage: true,
      fromPipeline: true,
      toPipeline: true,
    },
    orderBy: { movedAt: 'desc' },
  })
}
