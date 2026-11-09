import {
  ActivityComparisonChart,
  ActivityMixChart,
  SalesPerformanceChart,
} from '@/components/charts/reports-charts'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDashboardData, getReportsPageData } from '@/lib/crm/queries'
import { createEnumLabels } from '@/lib/i18n/enums'
import { displayStageName } from '@/lib/i18n/stages'
import { getI18n } from '@/lib/i18n/server'
import { formatCurrency } from '@/lib/format'

export default async function ReportsPage() {
  const { t, locale } = await getI18n()
  const labels = createEnumLabels(t)
  const [dashboard, reports] = await Promise.all([
    getDashboardData(locale),
    getReportsPageData(locale),
  ])

  const stageLabel = (entry: { stageKey: string | null; stage: string }) =>
    entry.stage === 'reports.unknownStage'
      ? t('reports.unknownStage')
      : displayStageName({ key: entry.stageKey, name: entry.stage }, t)

  const totalWon = reports.salesPerformance.reduce((sum, person) => sum + person.revenue, 0)
  const avgWinRate =
    reports.salesPerformance.length === 0
      ? 0
      : Math.round(
          reports.salesPerformance.reduce((sum, person) => sum + person.winRate, 0) /
            reports.salesPerformance.length,
        )
  const slowestStage = reports.pipelineAnalysis[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label={t('dashboard.activeDeals')} value={dashboard.openDeals} />
        <SummaryCard
          label={t('dashboard.colWonAmount')}
          value={formatCurrency(totalWon, 'TRY', locale)}
        />
        <SummaryCard label={t('reports.avgWinRate')} value={`%${avgWinRate}`} />
        <SummaryCard
          label={t('reports.forecastCoverage')}
          value={`%${reports.forecastCoverage}`}
          badge={slowestStage ? t('reports.slowestBadge', { stage: stageLabel(slowestStage) }) : undefined}
        />
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">{t('reports.tabSales')}</TabsTrigger>
          <TabsTrigger value="pipeline">{t('reports.tabPipeline')}</TabsTrigger>
          <TabsTrigger value="activity">{t('reports.tabActivity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.closedByUserChart')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesPerformanceChart
                data={reports.monthlyClosedByUser}
                seriesLabels={Object.fromEntries(
                  reports.salesPerformance.map((person) => [person.chartKey, person.name]),
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.winRateTable')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colUser')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTotalDeals')}</TableHead>
                    <TableHead className="text-right">{t('reports.colWon')}</TableHead>
                    <TableHead className="text-right">{t('reports.colWinRate')}</TableHead>
                    <TableHead className="text-right">{t('reports.colRevenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.salesPerformance.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell className="text-right">{person.totalDeals}</TableCell>
                      <TableCell className="text-right">{person.wonDeals}</TableCell>
                      <TableCell className="text-right">%{person.winRate}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(person.revenue, 'TRY', locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              label={t('quotes.weightedPipeline')}
              value={formatCurrency(reports.weightedPipelineValue, 'TRY', locale)}
            />
            <SummaryCard
              label={t('reports.stalledDeals')}
              value={reports.stalledDeals.length}
              badge={t('reports.stalledBadge')}
            />
            <SummaryCard
              label={t('reports.taggedSegments')}
              value={reports.tagPerformance.length}
              badge={t('reports.activeTagsBadge')}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.stageDurations')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.pipelineAnalysis.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('reports.noStageHistory')}</p>
              ) : (
                reports.pipelineAnalysis.map((stage) => (
                  <div key={stage.stage} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{stageLabel(stage)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('reports.transitionCount', { count: stage.transitions })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('dashboard.avgDays', { count: stage.avgDays })}</Badge>
                        <Badge variant="secondary">
                          {stage.avgDays <= 7
                            ? t('reports.paceFast')
                            : stage.avgDays <= 21
                              ? t('reports.paceNormal')
                              : t('reports.paceSlow')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.riskyDeals')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.stalledDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('reports.noStalledDeals')}</p>
              ) : (
                reports.stalledDeals.map((deal) => (
                  <div key={deal.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('reports.stalledFor', {
                            stage: stageLabel(deal),
                            count: deal.ageDays,
                          })}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {deal.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="warning">
                        {formatCurrency(deal.amount, 'TRY', locale)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.thisWeekVsLast')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityComparisonChart
                  data={reports.activitySummary.map((item) => ({
                    name: item.name,
                    thisWeek: item.thisWeek,
                    lastWeek: item.lastWeek,
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.activityMix')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityMixChart
                  data={reports.activityMix.map((item) => ({
                    name: labels.activityType[item.type],
                    value: item.value,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.activityByUser')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colUser')}</TableHead>
                    <TableHead className="text-right">{t('reports.colCalls')}</TableHead>
                    <TableHead className="text-right">{t('reports.colEmails')}</TableHead>
                    <TableHead className="text-right">{t('reports.colMeetings')}</TableHead>
                    <TableHead className="text-right">{t('reports.colThisWeek')}</TableHead>
                    <TableHead className="text-right">{t('reports.colLastWeek')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.activitySummary.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.call}</TableCell>
                      <TableCell className="text-right">{item.email}</TableCell>
                      <TableCell className="text-right">{item.meeting}</TableCell>
                      <TableCell className="text-right">{item.thisWeek}</TableCell>
                      <TableCell className="text-right">{item.lastWeek}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('reports.tagPerformance')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.colTag')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTagCompanies')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTagContacts')}</TableHead>
                    <TableHead className="text-right">{t('reports.colTagDeals')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.tagPerformance.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{tag.companyCount}</TableCell>
                      <TableCell className="text-right">{tag.contactCount}</TableCell>
                      <TableCell className="text-right">{tag.dealCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
