import type { ActivityType, Prisma } from '@prisma/client'
import { db } from '@/lib/db/prisma'

type TimelineActivityInput = {
  actorId?: string | null
  type: ActivityType
  subject: string
  description?: string | null
  metadata?: Prisma.InputJsonValue
  companyId?: string | null
  contactId?: string | null
  leadId?: string | null
  dealId?: string | null
  taskId?: string | null
}

export async function recordTimelineActivity(input: TimelineActivityInput) {
  return db.activity.create({
    data: {
      actorId: input.actorId ?? null,
      type: input.type,
      subject: input.subject,
      description: input.description ?? null,
      metadata: input.metadata,
      companyId: input.companyId ?? null,
      contactId: input.contactId ?? null,
      leadId: input.leadId ?? null,
      dealId: input.dealId ?? null,
      taskId: input.taskId ?? null,
    },
  })
}

export async function getActivitiesTimeline(filters: {
  companyId?: string | null
  contactId?: string | null
  leadId?: string | null
  dealId?: string | null
  taskId?: string | null
  limit?: number
}) {
  return db.activity.findMany({
    where: {
      companyId: filters.companyId,
      contactId: filters.contactId,
      leadId: filters.leadId,
      dealId: filters.dealId,
      taskId: filters.taskId,
    },
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      occurredAt: 'desc',
    },
    take: filters.limit ?? 50,
  })
}
