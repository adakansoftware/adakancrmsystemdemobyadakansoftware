'use server'

import { Prisma } from '@prisma/client'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { ensureDefaultDealPipeline } from '@/lib/crm/bootstrap'
import { createDealStageHistory, createDealValueHistory } from '@/lib/crm/pipeline'
import { db } from '@/lib/db/prisma'
import { dealSchema, deleteEntitySchema, updateDealSchema } from '@/lib/validation/crm'
import { revalidateCrmPaths, successResult } from './shared'

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
