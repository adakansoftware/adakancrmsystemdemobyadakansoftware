import { Prisma } from '@prisma/client'
import { db } from '@/lib/db/prisma'

export async function createDealStageHistory(input: {
  dealId: string
  actorId?: string | null
  fromPipelineId?: string | null
  toPipelineId: string
  fromStageId?: string | null
  toStageId: string
  amountSnapshot: Prisma.Decimal | number
  currency: string
  note?: string | null
}) {
  return db.dealStageHistory.create({
    data: {
      dealId: input.dealId,
      actorId: input.actorId ?? null,
      fromPipelineId: input.fromPipelineId ?? null,
      toPipelineId: input.toPipelineId,
      fromStageId: input.fromStageId ?? null,
      toStageId: input.toStageId,
      amountSnapshot:
        input.amountSnapshot instanceof Prisma.Decimal
          ? input.amountSnapshot
          : new Prisma.Decimal(input.amountSnapshot),
      currency: input.currency,
      note: input.note ?? null,
    },
  })
}

export async function createDealValueHistory(input: {
  dealId: string
  actorId?: string | null
  previousValue?: Prisma.Decimal | number | null
  newValue: Prisma.Decimal | number
  currency: string
  reason?: string | null
}) {
  return db.dealValueHistory.create({
    data: {
      dealId: input.dealId,
      actorId: input.actorId ?? null,
      previousValue:
        input.previousValue == null
          ? null
          : input.previousValue instanceof Prisma.Decimal
            ? input.previousValue
            : new Prisma.Decimal(input.previousValue),
      newValue:
        input.newValue instanceof Prisma.Decimal
          ? input.newValue
          : new Prisma.Decimal(input.newValue),
      currency: input.currency,
      reason: input.reason ?? null,
    },
  })
}

export async function getDealPipelineBoard(pipelineId?: string | null) {
  const pipeline = pipelineId
    ? await db.pipeline.findFirst({
        where: {
          id: pipelineId,
          entityType: 'DEAL',
          archivedAt: null,
        },
        include: {
          stages: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      })
    : await db.pipeline.findFirst({
        where: {
          entityType: 'DEAL',
          archivedAt: null,
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        include: {
          stages: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      })

  if (!pipeline) {
    return null
  }

  const deals = await db.deal.findMany({
    where: {
      pipelineId: pipeline.id,
      archivedAt: null,
    },
    include: {
      company: true,
      owner: true,
      stage: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const stages = pipeline.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    key: stage.key,
    position: stage.position,
    probability: stage.probability,
    isClosed: stage.isClosed,
    isWon: stage.isWon,
    deals: deals
      .filter((deal) => deal.stageId === stage.id)
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        company: deal.company?.name ?? '-',
        amount: Number(deal.amount),
        currency: deal.currency,
        ownerName: deal.owner
          ? `${deal.owner.firstName} ${deal.owner.lastName}`
          : 'Atanmamış',
        ownerInitials: deal.owner
          ? `${deal.owner.firstName[0] ?? ''}${deal.owner.lastName[0] ?? ''}`
          : '--',
        dueDate: deal.expectedCloseAt?.toISOString() ?? '',
        priority: deal.probability >= 75 ? 'HIGH' : deal.probability >= 40 ? 'MEDIUM' : 'LOW',
        status: deal.status,
      })),
  }))

  const metrics = {
    totalValue: deals.reduce((sum, deal) => sum + Number(deal.amount), 0),
    wonValue: deals
      .filter((deal) => deal.status === 'WON')
      .reduce((sum, deal) => sum + Number(deal.amount), 0),
    lostValue: deals
      .filter((deal) => deal.status === 'LOST')
      .reduce((sum, deal) => sum + Number(deal.amount), 0),
  }

  return {
    pipeline: {
      id: pipeline.id,
      name: pipeline.name,
      key: pipeline.key,
    },
    stages,
    metrics,
  }
}
