import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import { DEFAULT_LOCALE, localeToIntl, type Locale } from '@/lib/i18n/config'

// Shared open-state metrics used by both the dashboard page and the
// dashboard CSV export. No permission check: callers enforce their own.
export async function getOpenCrmMetrics() {
  const [totalContacts, totalCompanies, openLeads, openDeals, pendingTasks] = await Promise.all([
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
  ])

  return {
    totalContacts,
    totalCompanies,
    openLeads,
    openDealCount: openDeals.length,
    openDealValue: openDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    pendingTasks,
  }
}

export async function getDashboardData(locale: Locale = DEFAULT_LOCALE) {
  await requirePermission('deals:read')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    openMetrics,
    recentActivities,
    stageRows,
    staffRows,
    upcomingTasks,
    recentDeals,
  ] = await Promise.all([
    getOpenCrmMetrics(),
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
      select: {
        createdAt: true,
        amount: true,
        status: true,
        wonAt: true,
        closedAt: true,
      },
      orderBy: { wonAt: 'asc' },
    }),
  ])

  const {
    totalContacts,
    totalCompanies,
    openLeads,
    pendingTasks,
    openDealCount,
    openDealValue: totalOpenDealValue,
  } = openMetrics
  const dealRevenueByMonth = new Map<string, number>()
  const wonDeals = recentDeals.filter((deal) => deal.status === 'WON')
  const wonThisMonthDeals = wonDeals.filter(
    (deal) => deal.wonAt && deal.wonAt >= monthStart,
  )
  const closedDeals = recentDeals.filter(
    (deal) => deal.status === 'WON' || deal.status === 'LOST',
  )
  const cycleDays = closedDeals
    .map((deal) => {
      if (!deal.closedAt) {
        return null
      }

      const diffMs = deal.closedAt.getTime() - deal.createdAt.getTime()
      return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : null
    })
    .filter((value): value is number => value != null)

  for (const deal of wonDeals) {
    if (!deal.wonAt) {
      continue
    }

    const date = new Date(deal.wonAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    dealRevenueByMonth.set(key, (dealRevenueByMonth.get(key) ?? 0) + toNumber(deal.amount))
  }

  const chartData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const gelir = dealRevenueByMonth.get(key) ?? 0

    return {
      month: new Intl.DateTimeFormat(localeToIntl(locale), { month: 'short' }).format(date),
      gelir,
      hedef: Math.max(gelir * 0.9, 50000),
    }
  })

  return {
    totalContacts,
    totalCompanies,
    openLeads,
    openDeals: openDealCount,
    totalOpenDealValue,
    wonThisMonthCount: wonThisMonthDeals.length,
    wonThisMonthValue: wonThisMonthDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    conversionRate:
      recentDeals.length === 0
        ? 0
        : Math.round((wonDeals.length / recentDeals.length) * 100),
    averageDealCycleDays:
      cycleDays.length === 0
        ? 0
        : Math.round(cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length),
    pendingTasks,
    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      who: activity.actor ? `${activity.actor.firstName} ${activity.actor.lastName}` : 'common.system',
      subject: activity.subject,
      description: activity.description,
      type: activity.type,
      occurredAt: activity.occurredAt,
    })),
    pipelineValueByStage: stageRows.map((stage) => ({
      id: stage.id,
      stage: stage.name,
      stageKey: stage.key,
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
          : 'common.noRelation'),
      dueAt: task.dueAt,
      assigneeName: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'common.unassigned',
      assigneeInitials: task.assignee
        ? `${task.assignee.firstName[0] ?? ''}${task.assignee.lastName[0] ?? ''}`
        : '--',
      priority: task.priority,
    })),
    revenueData: chartData,
  }
}
