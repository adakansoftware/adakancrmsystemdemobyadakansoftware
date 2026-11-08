import { db } from '@/lib/db/prisma'
import { requireAuthenticatedUser, requirePermission } from '@/lib/auth/rbac'

export async function getQuickCreateOptions() {
  await requirePermission('companies:read')

  const [users, companies, contacts, leads, pipelines] = await Promise.all([
    db.user.findMany({
      where: { archivedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.company.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.contact.findMany({
      where: { archivedAt: null },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.lead.findMany({
      where: { archivedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.pipeline.findMany({
      where: { archivedAt: null, entityType: 'DEAL' },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          select: { id: true, name: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
  ])

  return {
    users: users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
    })),
    companies,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
    })),
    leads,
    pipelines: pipelines.map((pipeline) => ({
      id: pipeline.id,
      name: pipeline.name,
      stages: pipeline.stages,
    })),
  }
}

export async function getAssignableUsers() {
  await requireAuthenticatedUser()

  const users = await db.user.findMany({
    where: { archivedAt: null, status: { in: ['ACTIVE', 'INVITED'] } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return users.map((user) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
  }))
}

export type AssignableUsersData = Awaited<ReturnType<typeof getAssignableUsers>>
