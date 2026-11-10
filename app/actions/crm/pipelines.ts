'use server'

import { Prisma } from '@/lib/db/generated/prisma/client'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { ensureDefaultDealPipeline } from '@/lib/crm/bootstrap'
import {
  createDealStageHistory,
  createDealValueHistory,
  getDealPipelineBoard,
} from '@/lib/crm/pipeline'
import { db } from '@/lib/db/prisma'
import {
  moveDealSchema,
  pipelineQuerySchema,
  pipelineSchema,
  stageSchema,
  trackDealValueSchema,
  updatePipelineSchema,
  updateStageSchema,
} from '@/lib/validation/crm'
import { revalidateCrmPaths, successResult } from './shared'

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
