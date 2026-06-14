import { db } from '@/lib/db/prisma'
import { requireAuthenticatedUser, requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import type {
  CompanyRow,
  ContactRow,
  DealRow,
  EntityActivityViewModel,
  EntityNoteViewModel,
  LeadRow,
  TaskRow,
} from '@/lib/crm/view-models'

function mapEntityNotes(
  notes: Array<{
    id: string
    title: string | null
    body: string
    isPinned: boolean
    createdAt: Date
    author: { firstName: string; lastName: string } | null
  }>,
): EntityNoteViewModel[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    isPinned: note.isPinned,
    createdAt: note.createdAt,
    authorName: note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Sistem',
  }))
}

function mapEntityActivities(
  activities: Array<{
    id: string
    type: import('@prisma/client').ActivityType
    subject: string
    description: string | null
    occurredAt: Date
    actor: { firstName: string; lastName: string } | null
  }>,
): EntityActivityViewModel[] {
  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    subject: activity.subject,
    description: activity.description,
    occurredAt: activity.occurredAt,
    actorName: activity.actor
      ? `${activity.actor.firstName} ${activity.actor.lastName}`
      : 'Sistem',
  }))
}

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
      who: activity.actor ? `${activity.actor.firstName} ${activity.actor.lastName}` : 'Sistem',
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
        (task.contact ? `${task.contact.firstName} ${task.contact.lastName}` : 'Iliski yok'),
      dueAt: task.dueAt,
      assigneeName: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'Atanmamis',
      assigneeInitials: task.assignee
        ? `${task.assignee.firstName[0] ?? ''}${task.assignee.lastName[0] ?? ''}`
        : '--',
      priority: task.priority,
    })),
    revenueData: chartData,
  }
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

  return leads.map((lead): LeadRow => ({
    id: lead.id,
    title: lead.title,
    company: lead.company?.name ?? '-',
    contact: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : '-',
    source: lead.source,
    temperature: lead.temperature,
    status: lead.status,
    estimatedValue: toNumber(lead.estimatedValue),
    ownerId: lead.ownerId,
    owner: lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : 'Atanmamis',
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

  return tasks.map((task): TaskRow => ({
    id: task.id,
    title: task.title,
    related:
      task.company?.name ??
      (task.contact
        ? `${task.contact.firstName} ${task.contact.lastName}`
        : task.lead?.title ?? task.deal?.title ?? 'Bagli kayit yok'),
    priority: task.priority,
    status: task.status,
    dueAt: task.dueAt,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? `${task.assignee.firstName} ${task.assignee.lastName}`
      : 'Atanmamis',
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
      with: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Atanmamis',
    })),
    deals: deals.map((deal) => ({
      id: deal.id,
      date: deal.expectedCloseAt!,
      title: deal.title,
      type: 'DEAL' as const,
      with: deal.company?.name ?? 'Sirket yok',
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

export async function getContactsManagementPageData() {
  await requirePermission('contacts:read')

  const contacts = await db.contact.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true, city: true, industry: true } },
      owner: { select: { firstName: true, lastName: true } },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 6,
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
      deals: {
        where: { archivedAt: null },
        select: { amount: true, status: true },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 6,
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
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return contacts.map((contact): ContactRow => ({
    id: contact.id,
    companyId: contact.companyId,
    ownerId: contact.ownerId,
    createdAt: contact.createdAt,
    firstName: contact.firstName,
    lastName: contact.lastName,
    name: `${contact.firstName} ${contact.lastName}`,
    company: contact.company?.name ?? '-',
    city: contact.company?.city ?? '-',
    industry: contact.company?.industry ?? '-',
    jobTitle: contact.jobTitle ?? '',
    email: contact.email ?? '-',
    phone: contact.mobilePhone ?? contact.phone ?? '-',
    mobilePhone: contact.mobilePhone ?? '',
    owner: contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'Atanmamis',
    lastActivityAt: contact.activities[0]?.occurredAt ?? null,
    lastActivitySubject: contact.activities[0]?.subject ?? 'Henuz aktivite yok',
    relatedDealValue: contact.deals
      .filter((deal) => deal.status === 'OPEN')
      .reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    notes: mapEntityNotes(contact.notes),
    activities: mapEntityActivities(contact.activities),
  }))
}

export async function getCompaniesManagementPageData() {
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
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 6,
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
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 6,
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
    },
    orderBy: { name: 'asc' },
  })

  return companies.map((company): CompanyRow => ({
    id: company.id,
    name: company.name,
    legalName: company.legalName ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    sector: company.industry ?? '-',
    status: company.status,
    city: company.city ?? '-',
    country: company.country ?? '',
    addressLine1: company.addressLine1 ?? '',
    employeeCount: company.employeeCount,
    ownerId: company.ownerId,
    owner: company.owner ? `${company.owner.firstName} ${company.owner.lastName}` : 'Atanmamis',
    relatedCustomers: company._count.contacts,
    activeDeals: company.deals.filter((deal) => deal.status === 'OPEN').length,
    totalValue: company.deals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    notes: mapEntityNotes(company.notes),
    activities: mapEntityActivities(company.activities),
  }))
}

export async function getContactDetailPageData(contactId: string) {
  await requirePermission('contacts:read')

  const contact = await db.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      companyId: true,
      ownerId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      mobilePhone: true,
      jobTitle: true,
      linkedinUrl: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          city: true,
          industry: true,
        },
      },
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          amount: true,
          currency: true,
          status: true,
          stage: { select: { name: true } },
          expectedCloseAt: true,
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
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 10,
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
    },
  })

  if (!contact) {
    return null
  }

  return {
    id: contact.id,
    companyId: contact.companyId,
    ownerId: contact.ownerId,
    name: `${contact.firstName} ${contact.lastName}`,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '-',
    phone: contact.mobilePhone ?? contact.phone ?? '-',
    mobilePhone: contact.mobilePhone ?? '',
    jobTitle: contact.jobTitle ?? '-',
    linkedinUrl: contact.linkedinUrl ?? '',
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    company: contact.company,
    owner: contact.owner
      ? `${contact.owner.firstName} ${contact.owner.lastName}`
      : 'Atanmamis',
    deals: contact.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: toNumber(deal.amount),
      currency: deal.currency,
      status: deal.status,
      stage: deal.stage.name,
      expectedCloseAt: deal.expectedCloseAt,
    })),
    tasks: contact.tasks,
    activities: mapEntityActivities(contact.activities),
    notes: mapEntityNotes(contact.notes),
  }
}

export async function getCompanyDetailPageData(companyId: string) {
  await requirePermission('companies:read')

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      legalName: true,
      email: true,
      phone: true,
      website: true,
      industry: true,
      status: true,
      city: true,
      country: true,
      addressLine1: true,
      employeeCount: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      contacts: {
        where: { archivedAt: null },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          mobilePhone: true,
          jobTitle: true,
        },
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          amount: true,
          currency: true,
          status: true,
          expectedCloseAt: true,
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          stage: { select: { name: true } },
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
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 10,
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
    },
  })

  if (!company) {
    return null
  }

  return {
    ...company,
    ownerName: company.owner
      ? `${company.owner.firstName} ${company.owner.lastName}`
      : 'Atanmamis',
    contacts: company.contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email ?? '-',
      phone: contact.mobilePhone ?? contact.phone ?? '-',
      jobTitle: contact.jobTitle ?? '-',
    })),
    deals: company.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: toNumber(deal.amount),
      currency: deal.currency,
      status: deal.status,
      stage: deal.stage.name,
      contact: deal.contact
        ? `${deal.contact.firstName} ${deal.contact.lastName}`
        : '-',
      expectedCloseAt: deal.expectedCloseAt,
    })),
    tasks: company.tasks,
    activities: mapEntityActivities(company.activities),
    notes: mapEntityNotes(company.notes),
  }
}

export async function getDealDetailPageData(dealId: string) {
  await requirePermission('deals:read')

  const deal = await db.deal.findUnique({
    where: { id: dealId },
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

export async function getReportsPageData() {
  await requirePermission('deals:read')

  const [users, stageHistory, activities] = await Promise.all([
    db.user.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ownedDeals: {
          where: { archivedAt: null },
          select: {
            status: true,
            amount: true,
            wonAt: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    db.dealStageHistory.findMany({
      orderBy: [{ dealId: 'asc' }, { movedAt: 'asc' }],
      select: {
        dealId: true,
        movedAt: true,
        fromStageId: true,
        toStageId: true,
        fromStage: { select: { name: true } },
        toStage: { select: { name: true } },
      },
    }),
    db.activity.findMany({
      where: {
        occurredAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        type: true,
        occurredAt: true,
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ])

  const salesPerformance = users.map((user) => {
    const totalDeals = user.ownedDeals.length
    const wonDeals = user.ownedDeals.filter((deal) => deal.status === 'WON')
    const last6Months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index), 1)
      const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date)
      const count = wonDeals.filter((deal) => {
        if (!deal.wonAt) {
          return false
        }

        return (
          deal.wonAt.getMonth() === date.getMonth() &&
          deal.wonAt.getFullYear() === date.getFullYear()
        )
      }).length

      return { month, count }
    })

    return {
      id: user.id,
      chartKey: `user_${user.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 8)}`,
      name: `${user.firstName} ${user.lastName}`,
      totalDeals,
      wonDeals: wonDeals.length,
      winRate: totalDeals === 0 ? 0 : Math.round((wonDeals.length / totalDeals) * 100),
      revenue: wonDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
      monthlyClosed: last6Months,
    }
  })

  const monthlyClosedByUser = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index), 1)
    const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date)
    const entry: Record<string, number | string> = { month }

    for (const person of salesPerformance) {
      entry[person.chartKey] =
        person.monthlyClosed.find((item) => item.month === month)?.count ?? 0
    }

    return entry
  })

  const stageDurations = new Map<string, { name: string; totalMs: number; count: number }>()

  for (let index = 1; index < stageHistory.length; index += 1) {
    const previous = stageHistory[index - 1]
    const current = stageHistory[index]

    if (previous.dealId !== current.dealId || !previous.toStageId) {
      continue
    }

    const diffMs = current.movedAt.getTime() - previous.movedAt.getTime()
    const bucket = stageDurations.get(previous.toStageId) ?? {
      name: previous.toStage?.name ?? 'Bilinmeyen Asama',
      totalMs: 0,
      count: 0,
    }

    bucket.totalMs += Math.max(diffMs, 0)
    bucket.count += 1
    stageDurations.set(previous.toStageId, bucket)
  }

  const pipelineAnalysis = Array.from(stageDurations.entries())
    .map(([, value]) => ({
      stage: value.name,
      avgDays: value.count === 0 ? 0 : Math.round(value.totalMs / value.count / (1000 * 60 * 60 * 24)),
      transitions: value.count,
    }))
    .sort((left, right) => right.avgDays - left.avgDays)

  const now = Date.now()
  const weekStart = now - 7 * 24 * 60 * 60 * 1000
  const previousWeekStart = now - 14 * 24 * 60 * 60 * 1000
  const userActivityMap = new Map<
    string,
    {
      name: string
      call: number
      email: number
      meeting: number
      thisWeek: number
      lastWeek: number
    }
  >()

  for (const activity of activities) {
    if (!activity.actor?.id) {
      continue
    }

    const actorId = activity.actor.id

    const bucket = userActivityMap.get(actorId) ?? {
      name: `${activity.actor.firstName} ${activity.actor.lastName}`,
      call: 0,
      email: 0,
      meeting: 0,
      thisWeek: 0,
      lastWeek: 0,
    }

    if (activity.type === 'CALL') bucket.call += 1
    if (activity.type === 'EMAIL') bucket.email += 1
    if (activity.type === 'MEETING') bucket.meeting += 1

    const occurredAt = activity.occurredAt.getTime()
    if (occurredAt >= weekStart) bucket.thisWeek += 1
    if (occurredAt >= previousWeekStart && occurredAt < weekStart) bucket.lastWeek += 1

    userActivityMap.set(actorId, bucket)
  }

  const activitySummary = Array.from(userActivityMap.values()).sort(
    (left, right) => right.thisWeek - left.thisWeek,
  )

  return {
    salesPerformance,
    monthlyClosedByUser,
    pipelineAnalysis,
    activitySummary,
  }
}
