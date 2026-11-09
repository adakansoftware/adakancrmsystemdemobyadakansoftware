import {
  ArrowRight,
  CalendarCheck,
  FileText,
  Handshake,
  ListTodo,
  Phone,
  Settings2,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardFunnelChart } from '@/components/charts/dashboard-funnel-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDashboardData } from '@/lib/crm/queries'
import { createEnumLabels } from '@/lib/i18n/enums'
import { getI18n } from '@/lib/i18n/server'
import { translateMessage } from '@/lib/i18n'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/format'
import { priorityMeta } from '@/lib/ui-meta'

const activityIcon = {
  CALL: Phone,
  EMAIL: FileText,
  MEETING: CalendarCheck,
  NOTE: FileText,
  TASK: ListTodo,
  STATUS_CHANGE: Settings2,
  STAGE_CHANGE: TrendingUp,
  COMMENT: FileText,
  SYSTEM: Trophy,
}

export default async function DashboardPage() {
  const { t, locale } = await getI18n()
  const labels = createEnumLabels(t)
  const data = await getDashboardData(locale)
  const chartDelta =
    data.revenueData[data.revenueData.length - 1]?.gelir -
    data.revenueData[data.revenueData.length - 1]?.hedef

  return (
    <>
      <PageHeader title={t('nav.dashboard')} description={t('dashboard.description')}>
        <Button variant="outline" disabled aria-disabled="true">
          {t('dashboard.thisMonth')}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/api/export?entity=dashboard">{t('dashboard.downloadReport')}</Link>}
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('dashboard.activeDeals')}
          value={String(data.openDeals)}
          change={formatCurrency(data.totalOpenDealValue, 'TRY', locale)}
          trend="up"
          hint={t('dashboard.activeDealsHint')}
          icon={Handshake}
        />
        <StatCard
          title={t('dashboard.wonThisMonth')}
          value={String(data.wonThisMonthCount)}
          change={formatCurrency(data.wonThisMonthValue, 'TRY', locale)}
          trend="up"
          hint={t('dashboard.wonThisMonthHint')}
          icon={Trophy}
        />
        <StatCard
          title={t('dashboard.conversionRate')}
          value={`%${data.conversionRate}`}
          change={t('dashboard.openLeads', { count: data.openLeads })}
          trend="up"
          hint={t('dashboard.conversionRateHint')}
          icon={TrendingUp}
        />
        <StatCard
          title={t('dashboard.avgDuration')}
          value={t('dashboard.avgDays', { count: data.averageDealCycleDays })}
          change={t('dashboard.pendingTasks', { count: data.pendingTasks })}
          trend="up"
          hint={t('dashboard.avgDurationHint')}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.pipelineFunnel')}</CardTitle>
            <CardDescription>{t('dashboard.funnelDescription')}</CardDescription>
            <CardAction>
              <Badge variant={chartDelta >= 0 ? 'success' : 'warning'}>
                {chartDelta >= 0 ? t('dashboard.aboveTarget') : t('dashboard.nearTarget')}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DashboardFunnelChart data={data.pipelineValueByStage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenueChart')}</CardTitle>
            <CardDescription>{t('dashboard.revenueDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.staffPerformance')}</CardTitle>
            <CardDescription>{t('dashboard.staffPerformanceHint')}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.colRep')}</TableHead>
                  <TableHead className="text-center">{t('dashboard.colOpenDeals')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.colWonAmount')}</TableHead>
                  <TableHead className="text-right max-sm:hidden">{t('dashboard.colOpenTasks')}</TableHead>
                  <TableHead className="text-right max-sm:hidden">{t('common.colClose')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.staffPerformance.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                            {person.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{person.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{person.deals}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(person.revenue, 'TRY', locale)}
                    </TableCell>
                    <TableCell className="text-right max-sm:hidden">{person.taskLoad}</TableCell>
                    <TableCell className="text-right max-sm:hidden">
                      <Badge variant={person.rate >= 50 ? 'success' : 'secondary'}>%{person.rate}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivities')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.recentActivities.map((activity) => {
              const Icon = activityIcon[activity.type]
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{translateMessage(t, activity.who)}</span>{' '}
                      {activity.subject}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {labels.activityType[activity.type]} /{' '}
                      {formatRelativeDate(activity.occurredAt, locale)}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.upcomingTasks')}</CardTitle>
          <CardDescription>{t('dashboard.upcomingTasksDescription')}</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link href="/gorevler">
                  {t('dashboard.allTasks')} <ArrowRight data-icon="inline-end" />
                </Link>
              }
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-xs font-semibold">
                    {task.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {translateMessage(t, task.related)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <Badge variant={priorityMeta[task.priority].variant}>
                  {labels.taskPriority[task.priority]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(task.dueAt, locale)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
