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
      <PageHeader
        title="Dashboard"
        description="CRM operasyonunuzun canlı görünümü"
      >
        <Button variant="outline">Bu Ay</Button>
        <Button>Rapor İndir</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Toplam Kişi"
          value={String(data.totalContacts)}
          change={`${data.totalCompanies} firma`}
          trend="up"
          hint="ilişkili kayıt"
          icon={Users}
        />
        <StatCard
          title="Açık Anlaşmalar"
          value={String(data.openDeals)}
          change={`${data.openLeads} açık lead`}
          trend="up"
          hint="aktif satış hattı"
          icon={Handshake}
        />
        <StatCard
          title="Açık Deal Değeri"
          value={formatCurrency(data.totalOpenDealValue)}
          change={formatCompact(data.totalOpenDealValue)}
          trend="up"
          hint="toplam pipeline tutarı"
          icon={TrendingUp}
        />
        <StatCard
          title="Bekleyen Görevler"
          value={String(data.pendingTasks)}
          change={`${data.upcomingTasks.length} yakın teslim`}
          trend="down"
          hint="takip gerektiren iş"
          icon={ListTodo}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir Grafiği</CardTitle>
            <CardDescription>Son 6 ayın anlaşma tutarı görünümü</CardDescription>
            <CardAction>
              <Badge variant={chartDelta >= 0 ? 'success' : 'warning'}>
                {chartDelta >= 0 ? 'Hedef üstü' : 'Hedefe yakın'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Değeri</CardTitle>
            <CardDescription>
              Toplam {formatCurrency(totalPipeline)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.pipelineValueByStage.map((stage) => {
              const percentage =
                totalPipeline === 0 ? 0 : Math.round((stage.value / totalPipeline) * 100)

              return (
                <div key={stage.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count} · {formatCompact(stage.value)} ₺
                    </span>
                  </div>
                  <Progress value={percentage} aria-label={`${stage.stage} yüzde ${percentage}`} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personel Performansı</CardTitle>
            <CardDescription>Atanan deal ve görev yükü görünümü</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temsilci</TableHead>
                  <TableHead className="text-center">Açık Deal</TableHead>
                  <TableHead className="text-right">Kazanılan Tutar</TableHead>
                  <TableHead className="text-right max-sm:hidden">Açık Görev</TableHead>
                  <TableHead className="text-right max-sm:hidden">Kapanış</TableHead>
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
                    <TableCell className="text-right max-sm:hidden">
                      {person.taskLoad}
                    </TableCell>
                    <TableCell className="text-right max-sm:hidden">
                      <Badge variant={person.rate >= 50 ? 'success' : 'secondary'}>
                        %{person.rate}
                      </Badge>
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
                      <span className="font-medium">{activity.who}</span>{' '}
                      {activity.subject}
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
          <CardTitle>Yaklaşan Görevler</CardTitle>
          <CardDescription>Önümüzdeki günlerde planlanan işler</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href="/gorevler">
                  Tüm görevler <ArrowRight data-icon="inline-end" />
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
                <Badge variant={priorityMeta[task.priority].variant}>
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(task.dueAt)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
