import { db } from '@/lib/db/prisma'
import { requireAuthenticatedUser, requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'

export async function getDashboardData() {
  await requirePermission('deals:read')

  const [
    totalContacts,
    totalCompanies,
    openLeads,
    openDeals,
    pendingTasks,
    recentActivities,
    stageRows,
    staffRows,
    upcomingTasks,
    recentDeals,
  ] = await Promise.all([
    db.contact.count({ where: { archivedAt: null } }),
    db.company.count({ where: { archivedAt: null } }),
    db.lead.count({ where: { archivedAt: null, status: 'OPEN' } }),
    db.deal.findMany({
      where: { archivedAt: null, status: 'OPEN' },
      select: { amount: true },
    }),
    db.task.count({
      where: { archivedAt: null, status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } },
    }),
    db.activity.findMany({
      take: 6,
      orderBy: { occurredAt: 'desc' },
      include: {
        actor: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.stage.findMany({
      where: { pipeline: { entityType: 'DEAL' } },
      orderBy: [{ pipeline: { isDefault: 'desc' } }, { position: 'asc' }],
      include: {
        deals: {
          where: { archivedAt: null },
          select: { amount: true, status: true },
        },
      },
    }),
    db.user.findMany({
      where: { archivedAt: null },
      include: {
        ownedDeals: {
          where: { archivedAt: null },
          select: { status: true, amount: true },
        },
        assignedTasks: {
          where: { archivedAt: null },
          select: { status: true },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.task.findMany({
      where: {
        archivedAt: null,
        status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
      },
      include: {
        assignee: {
          select: { firstName: true, lastName: true },
        },
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      take: 5,
    }),
    db.deal.findMany({
      where: { archivedAt: null },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const totalOpenDealValue = openDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0)
  const dealRevenueByMonth = new Map<string, number>()

  for (const deal of recentDeals) {
    const date = new Date(deal.createdAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    dealRevenueByMonth.set(key, (dealRevenueByMonth.get(key) ?? 0) + toNumber(deal.amount))
  }

  const chartData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const gelir = dealRevenueByMonth.get(key) ?? 0

    return {
      month: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date),
      gelir,
      hedef: Math.max(gelir * 0.9, 50000),
    }
  })

  return {
    totalContacts,
    totalCompanies,
    openLeads,
    openDeals: openDeals.length,
    totalOpenDealValue,
    pendingTasks,
    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      who:
        activity.actor == null
          ? 'Sistem'
          : `${activity.actor.firstName} ${activity.actor.lastName}`,
      subject: activity.subject,
      description: activity.description,
      type: activity.type,
      occurredAt: activity.occurredAt,
    })),
    pipelineValueByStage: stageRows.map((stage) => ({
      id: stage.id,
      stage: stage.name,
      count: stage.deals.filter((deal) => deal.status === 'OPEN').length,
      value: stage.deals
        .filter((deal) => deal.status === 'OPEN')
        .reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    })),
    staffPerformance: staffRows.map((user) => {
      const deals = user.ownedDeals.filter((deal) => deal.status === 'OPEN')
      const wonDeals = user.ownedDeals.filter((deal) => deal.status === 'WON')
      const openTasks = user.assignedTasks.filter((task) => task.status !== 'DONE').length

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`,
        deals: deals.length,
        revenue: wonDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
        taskLoad: openTasks,
        rate:
          user.ownedDeals.length === 0
            ? 0
            : Math.round((wonDeals.length / user.ownedDeals.length) * 100),
      }
    }),
    upcomingTasks: upcomingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      related:
        task.company?.name ??
        (task.contact
          ? `${task.contact.firstName} ${task.contact.lastName}`
          : 'İlişki yok'),
      dueAt: task.dueAt,
      assigneeName: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Atanmamış',
      assigneeInitials: task.assignee
        ? `${task.assignee.firstName[0] ?? ''}${task.assignee.lastName[0] ?? ''}`
        : '--',
      priority: task.priority,
    })),
    revenueData: chartData,
  }
}

export async function getContactsPageData() {
  await requirePermission('contacts:read')

  const contacts = await db.contact.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true, city: true, industry: true } },
      owner: { select: { firstName: true, lastName: true } },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 1,
        select: { occurredAt: true, subject: true },
      },
      deals: {
        where: { archivedAt: null },
        select: { amount: true, status: true },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        select: { id: true, body: true, title: true },
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return contacts.map((contact) => ({
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`,
    company: contact.company?.name ?? '-',
    city: contact.company?.city ?? '-',
    industry: contact.company?.industry ?? '-',
    email: contact.email ?? '-',
    phone: contact.mobilePhone ?? contact.phone ?? '-',
    owner: contact.owner
      ? `${contact.owner.firstName} ${contact.owner.lastName}`
      : 'Atanmamış',
    lastActivityAt: contact.activities[0]?.occurredAt ?? null,
    lastActivitySubject: contact.activities[0]?.subject ?? 'Henüz aktivite yok',
    relatedDealValue: contact.deals
      .filter((deal) => deal.status === 'OPEN')
      .reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    notes: contact.notes,
  }))
}

export async function getCompaniesPageData() {
  await requirePermission('companies:read')

  const companies = await db.company.findMany({
    where: { archivedAt: null },
    include: {
      owner: { select: { firstName: true, lastName: true } },
      _count: { select: { contacts: true } },
      deals: {
        where: { archivedAt: null },
        select: { amount: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    sector: company.industry ?? '-',
    city: company.city ?? '-',
    owner: company.owner
      ? `${company.owner.firstName} ${company.owner.lastName}`
      : 'Atanmamış',
    relatedCustomers: company._count.contacts,
    activeDeals: company.deals.filter((deal) => deal.status === 'OPEN').length,
    totalValue: company.deals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
  }))
}

export async function getLeadsPageData() {
  await requirePermission('leads:read')

  const leads = await db.lead.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      owner: { select: { firstName: true, lastName: true } },
      stage: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return leads.map((lead) => ({
    id: lead.id,
    title: lead.title,
    company: lead.company?.name ?? '-',
    contact: lead.contact
      ? `${lead.contact.firstName} ${lead.contact.lastName}`
      : '-',
    source: lead.source,
    temperature: lead.temperature,
    status: lead.status,
    estimatedValue: toNumber(lead.estimatedValue),
    ownerId: lead.ownerId,
    owner: lead.owner
      ? `${lead.owner.firstName} ${lead.owner.lastName}`
      : 'Atanmamış',
    stage: lead.stage.name,
    email: lead.email ?? '-',
    phone: lead.phone ?? '-',
  }))
}

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

  return deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    company: deal.company?.name ?? '-',
    contact: deal.contact
      ? `${deal.contact.firstName} ${deal.contact.lastName}`
      : '-',
    amount: toNumber(deal.amount),
    currency: deal.currency,
    status: deal.status,
    probability: deal.probability,
    expectedCloseAt: deal.expectedCloseAt,
    ownerId: deal.ownerId,
    owner: deal.owner
      ? `${deal.owner.firstName} ${deal.owner.lastName}`
      : 'Atanmamış',
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

export async function getTasksPageData() {
  await requirePermission('activities:read')

  const tasks = await db.task.findMany({
    where: { archivedAt: null },
    include: {
      assignee: { select: { firstName: true, lastName: true } },
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      lead: { select: { title: true } },
      deal: { select: { title: true } },
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  })

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    related:
      task.company?.name ??
      (task.contact
        ? `${task.contact.firstName} ${task.contact.lastName}`
        : task.lead?.title ?? task.deal?.title ?? 'Bağlı kayıt yok'),
    priority: task.priority,
    status: task.status,
    dueAt: task.dueAt,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? `${task.assignee.firstName} ${task.assignee.lastName}`
      : 'Atanmamış',
    assigneeInitials: task.assignee
      ? `${task.assignee.firstName[0] ?? ''}${task.assignee.lastName[0] ?? ''}`
      : '--',
  }))
}

export async function getCalendarPageData() {
  await requirePermission('activities:read')

  const [tasks, deals] = await Promise.all([
    db.task.findMany({
      where: {
        archivedAt: null,
        dueAt: { not: null },
      },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueAt: 'asc' },
      take: 50,
    }),
    db.deal.findMany({
      where: {
        archivedAt: null,
        expectedCloseAt: { not: null },
      },
      include: {
        company: { select: { name: true } },
      },
      orderBy: { expectedCloseAt: 'asc' },
      take: 50,
    }),
  ])

  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      date: task.dueAt!,
      title: task.title,
      type: 'TASK' as const,
      with: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Atanmamış',
    })),
    deals: deals.map((deal) => ({
      id: deal.id,
      date: deal.expectedCloseAt!,
      title: deal.title,
      type: 'DEAL' as const,
      with: deal.company?.name ?? 'Şirket yok',
    })),
  }
}

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
