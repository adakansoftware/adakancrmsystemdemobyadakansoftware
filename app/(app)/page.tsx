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
  Users,
} from 'lucide-react'
import Link from 'next/link'
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
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDashboardData } from '@/lib/crm/queries'
import { formatCompact, formatCurrency, formatDate, formatRelativeDate } from '@/lib/format'
import { activityTypeMeta, priorityMeta } from '@/lib/ui-meta'

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
  const data = await getDashboardData()
  const totalPipeline = data.pipelineValueByStage.reduce((sum, stage) => sum + stage.value, 0)
  const chartDelta =
    data.revenueData[data.revenueData.length - 1]?.gelir -
    data.revenueData[data.revenueData.length - 1]?.hedef

  return (
    <>
      <PageHeader title="Dashboard" description="CRM operasyonunuzun canli gorunumu">
        <Button variant="outline" disabled aria-disabled="true">
          Bu Ay
        </Button>
        <Button
          nativeButton={false}
          render={
            <Link href="/api/export?entity=dashboard">
              Rapor Indir
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Toplam Kisi"
          value={String(data.totalContacts)}
          change={`${data.totalCompanies} firma`}
          trend="up"
          hint="iliskili kayit"
          icon={Users}
        />
        <StatCard
          title="Acik Anlasmalar"
          value={String(data.openDeals)}
          change={`${data.openLeads} acik lead`}
          trend="up"
          hint="aktif satis hatti"
          icon={Handshake}
        />
        <StatCard
          title="Acik Deal Degeri"
          value={formatCurrency(data.totalOpenDealValue)}
          change={formatCompact(data.totalOpenDealValue)}
          trend="up"
          hint="toplam pipeline tutari"
          icon={TrendingUp}
        />
        <StatCard
          title="Bekleyen Gorevler"
          value={String(data.pendingTasks)}
          change={`${data.upcomingTasks.length} yakin teslim`}
          trend="down"
          hint="takip gerektiren is"
          icon={ListTodo}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir Grafigi</CardTitle>
            <CardDescription>Son 6 ayin anlasma tutari gorunumu</CardDescription>
            <CardAction>
              <Badge variant={chartDelta >= 0 ? 'success' : 'warning'}>
                {chartDelta >= 0 ? 'Hedef ustu' : 'Hedefe yakin'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Degeri</CardTitle>
            <CardDescription>Toplam {formatCurrency(totalPipeline)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.pipelineValueByStage.map((stage) => {
              const percentage = totalPipeline === 0 ? 0 : Math.round((stage.value / totalPipeline) * 100)
              return (
                <div key={stage.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count} · {formatCompact(stage.value)} ₺
                    </span>
                  </div>
                  <Progress value={percentage} aria-label={`${stage.stage} yuzde ${percentage}`} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personel Performansi</CardTitle>
            <CardDescription>Atanan deal ve gorev yuku gorunumu</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temsilci</TableHead>
                  <TableHead className="text-center">Acik Deal</TableHead>
                  <TableHead className="text-right">Kazanilan Tutar</TableHead>
                  <TableHead className="text-right max-sm:hidden">Acik Gorev</TableHead>
                  <TableHead className="text-right max-sm:hidden">Kapanis</TableHead>
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
                      {formatCurrency(person.revenue)}
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
            <CardTitle>Son Aktiviteler</CardTitle>
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
                      <span className="font-medium">{activity.who}</span> {activity.subject}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {activityTypeMeta[activity.type].label} · {formatRelativeDate(activity.occurredAt)}
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
          <CardTitle>Yaklasan Gorevler</CardTitle>
          <CardDescription>Onumuzdeki gunlerde planlanan isler</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link href="/gorevler">
                  Tum gorevler <ArrowRight data-icon="inline-end" />
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
                  <span className="text-xs text-muted-foreground">{task.related}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <Badge variant={priorityMeta[task.priority].variant}>{task.priority}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(task.dueAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
