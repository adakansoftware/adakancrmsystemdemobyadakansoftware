import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'

export async function getSettingsOverviewData() {
  await requirePermission('deals:read')

  const [companyCount, contactCount, dealCount, taskCount, pipelines, tags] = await Promise.all([
    db.company.count({ where: { archivedAt: null } }),
    db.contact.count({ where: { archivedAt: null } }),
    db.deal.count({ where: { archivedAt: null } }),
    db.task.count({ where: { archivedAt: null } }),
    db.pipeline.findMany({
      where: { archivedAt: null, entityType: 'DEAL' },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            key: true,
            name: true,
            position: true,
            probability: true,
            isClosed: true,
            isWon: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
    db.tag.findMany({
      include: {
        _count: {
          select: {
            companies: true,
            contacts: true,
            deals: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    }),
  ])

  return {
    counts: {
      companies: companyCount,
      contacts: contactCount,
      deals: dealCount,
      tasks: taskCount,
    },
    pipelines,
    tags,
  }
}

export type SettingsOverviewData = Awaited<ReturnType<typeof getSettingsOverviewData>>
