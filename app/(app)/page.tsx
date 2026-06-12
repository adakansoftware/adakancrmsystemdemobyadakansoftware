import {
  ArrowRight,
  CalendarCheck,
  FileText,
  Handshake,
  ListTodo,
  Phone,
  ReceiptText,
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
import {
  formatCompact,
  formatCurrency,
  pipelineSummary,
  priorityMeta,
  recentActivities,
  staffPerformance,
  upcomingTasks,
} from '@/lib/data'

const activityIcon = {
  call: Phone,
  quote: FileText,
  meeting: CalendarCheck,
  won: Trophy,
  invoice: ReceiptText,
}

const totalPipeline = pipelineSummary.reduce((sum, stage) => sum + stage.value, 0)

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="İşletmenizin genel görünümü - 1-30 Haziran 2026"
      >
        <Button variant="outline">Bu Ay</Button>
        <Button>Rapor İndir</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Toplam Müşteri"
          value="248"
          change="+12,5%"
          trend="up"
          hint="geçen aya göre"
          icon={Users}
        />
        <StatCard
          title="Açık Anlaşmalar"
          value="34"
          change="+8,2%"
          trend="up"
          hint="geçen aya göre"
          icon={Handshake}
        />
        <StatCard
          title="Aylık Gelir"
          value="₺642B"
          change="+18,3%"
          trend="up"
          hint="geçen aya göre"
          icon={TrendingUp}
        />
        <StatCard
          title="Bekleyen Görevler"
          value="17"
          change="-4,1%"
          trend="down"
          hint="geçen haftaya göre"
          icon={ListTodo}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gelir Grafiği</CardTitle>
            <CardDescription>
              Aylık gerçekleşen gelir ve hedef karşılaştırması
            </CardDescription>
            <CardAction>
              <Badge variant="success">Hedefin %114 üzerinde</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Satış Hattı Özeti</CardTitle>
            <CardDescription>
              Toplam {formatCurrency(totalPipeline)} değerinde
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {pipelineSummary.map((stage) => {
              const percentage = Math.round((stage.value / totalPipeline) * 100)

              return (
                <div key={stage.stage} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count} · {formatCompact(stage.value)} ₺
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    aria-label={`${stage.stage} aşaması ${percentage}%`}
                  />
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
            <CardDescription>Bu ayki en iyi temsilciler</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temsilci</TableHead>
                  <TableHead className="text-center">Anlaşma</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                  <TableHead className="text-right max-sm:hidden">
                    Dönüşüm
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffPerformance.map((person) => (
                  <TableRow key={person.name}>
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
                      <Badge
                        variant={person.rate >= 60 ? 'success' : 'secondary'}
                      >
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
            {recentActivities.map((activity) => {
              const Icon = activityIcon[activity.type]

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{activity.who}</span>{' '}
                      {activity.action}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
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
          <CardDescription>Önümüzdeki günlerde yapılacaklar</CardDescription>
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
          {upcomingTasks.map((task) => (
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
                  <span className="truncate text-sm font-medium">
                    {task.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {task.related}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <Badge variant={priorityMeta[task.priority].variant}>
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {task.dueDate}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
