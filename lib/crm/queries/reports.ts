import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import { DEFAULT_LOCALE, localeToIntl, type Locale } from '@/lib/i18n/config'

export async function getReportsPageData(locale: Locale = DEFAULT_LOCALE) {
  await requirePermission('deals:read')

  const [users, stageHistory, activities, deals, tags] = await Promise.all([
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
        fromStage: { select: { key: true, name: true } },
        toStage: { select: { key: true, name: true } },
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
    db.deal.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        title: true,
        amount: true,
        probability: true,
        createdAt: true,
        expectedCloseAt: true,
        status: true,
        stage: {
          select: {
            key: true,
            name: true,
          },
        },
        tags: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            companies: true,
            contacts: true,
            deals: true,
          },
        },
      },
      orderBy: [{ deals: { _count: 'desc' } }, { name: 'asc' }],
    }),
  ])

  const salesPerformance = users.map((user) => {
    const totalDeals = user.ownedDeals.length
    const wonDeals = user.ownedDeals.filter((deal) => deal.status === 'WON')
    const last6Months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index), 1)
      const month = new Intl.DateTimeFormat(localeToIntl(locale), { month: 'short' }).format(date)
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
    const month = new Intl.DateTimeFormat(localeToIntl(locale), { month: 'short' }).format(date)
    const entry: Record<string, number | string> = { month }

    for (const person of salesPerformance) {
      entry[person.chartKey] =
        person.monthlyClosed.find((item) => item.month === month)?.count ?? 0
    }

    return entry
  })

  const stageDurations = new Map<
    string,
    { key: string | null; name: string; totalMs: number; count: number }
  >()

  for (let index = 1; index < stageHistory.length; index += 1) {
    const previous = stageHistory[index - 1]
    const current = stageHistory[index]

    if (previous.dealId !== current.dealId || !previous.toStageId) {
      continue
    }

    const diffMs = current.movedAt.getTime() - previous.movedAt.getTime()
    const bucket = stageDurations.get(previous.toStageId) ?? {
      key: previous.toStage?.key ?? null,
      name: previous.toStage?.name ?? 'reports.unknownStage',
      totalMs: 0,
      count: 0,
    }

    bucket.totalMs += Math.max(diffMs, 0)
    bucket.count += 1
    stageDurations.set(previous.toStageId, bucket)
  }

  const pipelineAnalysis = Array.from(stageDurations.entries())
    .map(([, value]) => ({
      stageKey: value.key,
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

  const openDeals = deals.filter((deal) => deal.status === 'OPEN')
  const weightedPipelineValue = openDeals.reduce(
    (sum, deal) => sum + toNumber(deal.amount) * (deal.probability / 100),
    0,
  )
  const forecastCoverage =
    openDeals.length === 0
      ? 0
      : Math.round(
          (openDeals.filter((deal) => {
            if (!deal.expectedCloseAt) {
              return false
            }

            return (
              deal.expectedCloseAt.getTime() <=
              Date.now() + 30 * 24 * 60 * 60 * 1000
            )
          }).length /
            openDeals.length) *
            100,
        )
  const stalledDeals = openDeals
    .filter((deal) => {
      const referenceDate = deal.expectedCloseAt ?? deal.createdAt
      return Date.now() - referenceDate.getTime() > 21 * 24 * 60 * 60 * 1000
    })
    .sort((left, right) => toNumber(right.amount) - toNumber(left.amount))
    .slice(0, 5)
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      stage: deal.stage.name,
      stageKey: deal.stage.key,
      amount: toNumber(deal.amount),
      ageDays: Math.round(
        (Date.now() - (deal.expectedCloseAt ?? deal.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      tags: deal.tags.map((tag) => tag.name),
    }))
  const activityMixTotals = activitySummary.reduce(
    (totals, item) => ({
      call: totals.call + item.call,
      email: totals.email + item.email,
      meeting: totals.meeting + item.meeting,
    }),
    { call: 0, email: 0, meeting: 0 },
  )

  return {
    salesPerformance,
    monthlyClosedByUser,
    pipelineAnalysis,
    activitySummary,
    weightedPipelineValue,
    forecastCoverage,
    stalledDeals,
    activityMix: [
      { type: 'CALL' as const, value: activityMixTotals.call },
      { type: 'EMAIL' as const, value: activityMixTotals.email },
      { type: 'MEETING' as const, value: activityMixTotals.meeting },
    ],
    tagPerformance: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      companyCount: tag._count.companies,
      contactCount: tag._count.contacts,
      dealCount: tag._count.deals,
    })),
  }
}
