import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import type { DealRow } from '@/lib/crm/view-models'
import { mapEntityActivities, mapEntityNotes } from './shared'

export async function getDealsPageData() {
  await requirePermission('deals:read')

  const deals = await db.deal.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      owner: { select: { firstName: true, lastName: true } },
      stage: { select: { id: true, name: true, isClosed: true, isWon: true } },
      pipeline: {
        include: {
          stages: {
            orderBy: { position: 'asc' },
            select: { id: true, name: true, isClosed: true, isWon: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return deals.map((deal): DealRow => ({
    id: deal.id,
    title: deal.title,
    company: deal.company?.name ?? '-',
    contact: deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '-',
    amount: toNumber(deal.amount),
    currency: deal.currency,
    status: deal.status,
    probability: deal.probability,
    expectedCloseAt: deal.expectedCloseAt,
    ownerId: deal.ownerId,
    owner: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Atanmamis',
    ownerInitials: deal.owner
      ? `${deal.owner.firstName[0] ?? ''}${deal.owner.lastName[0] ?? ''}`
      : '--',
    stage: deal.stage.name,
    stageId: deal.stageId,
    pipelineId: deal.pipelineId,
    availableStages: deal.pipeline.stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      isClosed: stage.isClosed,
      isWon: stage.isWon,
    })),
  }))
}

export async function getDealDetailPageData(dealId: string) {
  await requirePermission('deals:read')

  const deal = await db.deal.findFirst({
    where: { id: dealId, archivedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      amount: true,
      currency: true,
      status: true,
      probability: true,
      expectedCloseAt: true,
      pipelineId: true,
      stageId: true,
      ownerId: true,
      contactId: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      stage: {
        select: {
          id: true,
          name: true,
          isClosed: true,
          isWon: true,
        },
      },
      pipeline: {
        select: {
          id: true,
          name: true,
          stages: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              name: true,
              isClosed: true,
              isWon: true,
            },
          },
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 12,
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          occurredAt: true,
          actor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueAt: true,
          assignee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      stageHistory: {
        orderBy: { movedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          movedAt: true,
          note: true,
          fromStage: { select: { name: true } },
          toStage: { select: { name: true } },
          actor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!deal) {
    return null
  }

  return {
    id: deal.id,
    title: deal.title,
    description: deal.description ?? '',
    amount: toNumber(deal.amount),
    currency: deal.currency,
    status: deal.status,
    probability: deal.probability,
    expectedCloseAt: deal.expectedCloseAt,
    pipelineId: deal.pipelineId,
    stageId: deal.stageId,
    ownerId: deal.ownerId,
    contactId: deal.contactId,
    companyId: deal.companyId,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    owner: deal.owner
      ? {
          name: `${deal.owner.firstName} ${deal.owner.lastName}`,
          email: deal.owner.email,
        }
      : null,
    company: deal.company,
    contact: deal.contact
      ? {
          id: deal.contact.id,
          name: `${deal.contact.firstName} ${deal.contact.lastName}`,
          email: deal.contact.email ?? '-',
        }
      : null,
    stage: deal.stage,
    pipeline: {
      id: deal.pipeline.id,
      name: deal.pipeline.name,
      stages: deal.pipeline.stages,
    },
    activities: mapEntityActivities(deal.activities),
    notes: mapEntityNotes(deal.notes),
    tasks: deal.tasks.map((task) => ({
      ...task,
      assigneeName: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Atanmamis',
    })),
    history: deal.stageHistory.map((entry) => ({
      id: entry.id,
      movedAt: entry.movedAt,
      fromStage: entry.fromStage?.name ?? 'Baslangic',
      toStage: entry.toStage.name,
      note: entry.note ?? '',
      actorName: entry.actor
        ? `${entry.actor.firstName} ${entry.actor.lastName}`
        : 'Sistem',
    })),
  }
}

export type DealsPageData = Awaited<ReturnType<typeof getDealsPageData>>
