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
import { formatCurrency } from '@/lib/format'

export default async function ReportsPage() {
  const [dashboard, reports] = await Promise.all([
    getDashboardData(),
    getReportsPageData(),
  ])

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
        title="Raporlar"
        description="Satis performansi, pipeline hizi ve aktivite kalitesi tek gorunumde."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Acik Deal" value={dashboard.openDeals} />
        <SummaryCard label="Kazanilan Tutar" value={formatCurrency(totalWon)} />
        <SummaryCard label="Ortalama Win Rate" value={`%${avgWinRate}`} />
        <SummaryCard
          label="30 Gun Forecast Coverage"
          value={`%${reports.forecastCoverage}`}
          badge={slowestStage ? `En yavas: ${slowestStage.stage}` : undefined}
        />
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Satis Performansi</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analizi</TabsTrigger>
          <TabsTrigger value="activity">Aktivite Ozeti</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanici Bazli Kapanan Deal Grafiği</CardTitle>
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
              <CardTitle>Kazanma Orani Tablosu</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanici</TableHead>
                    <TableHead className="text-right">Toplam Deal</TableHead>
                    <TableHead className="text-right">Kazanilan</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.salesPerformance.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell className="text-right">{person.totalDeals}</TableCell>
                      <TableCell className="text-right">{person.wonDeals}</TableCell>
                      <TableCell className="text-right">%{person.winRate}</TableCell>
                      <TableCell className="text-right">{formatCurrency(person.revenue)}</TableCell>
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
              label="Weighted Pipeline"
              value={formatCurrency(reports.weightedPipelineValue)}
            />
            <SummaryCard
              label="Stalled Deal"
              value={reports.stalledDeals.length}
              badge="21+ gun"
            />
            <SummaryCard
              label="Etiketli Segment"
              value={reports.tagPerformance.length}
              badge="aktif etiket"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stage Bekleme Sureleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.pipelineAnalysis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henuz stage hareket verisi yok.</p>
              ) : (
                reports.pipelineAnalysis.map((stage) => (
                  <div key={stage.stage} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{stage.stage}</p>
                        <p className="text-xs text-muted-foreground">
                          {stage.transitions} gecis kaydi
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stage.avgDays} gun</Badge>
                        <Badge variant="secondary">
                          {stage.avgDays <= 7 ? 'Hizli' : stage.avgDays <= 21 ? 'Normal' : 'Yavas'}
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
              <CardTitle>Riskli ve Yavaslayan Deal&apos;lar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.stalledDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Kritik bekleyen deal gorunmuyor.</p>
              ) : (
                reports.stalledDeals.map((deal) => (
                  <div key={deal.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.stage} asamasinda {deal.ageDays} gundur bekliyor
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {deal.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="warning">{formatCurrency(deal.amount)}</Badge>
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
                <CardTitle>Bu Hafta vs Gecen Hafta</CardTitle>
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
                <CardTitle>Aktivite Karmasi</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityMixChart data={reports.activityMix} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kullanici Bazli Aktivite Dagilimi</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanici</TableHead>
                    <TableHead className="text-right">Arama</TableHead>
                    <TableHead className="text-right">E-posta</TableHead>
                    <TableHead className="text-right">Toplanti</TableHead>
                    <TableHead className="text-right">Bu Hafta</TableHead>
                    <TableHead className="text-right">Gecen Hafta</TableHead>
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
              <CardTitle>Etiket Performansi</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etiket</TableHead>
                    <TableHead className="text-right">Firma</TableHead>
                    <TableHead className="text-right">Kisi</TableHead>
                    <TableHead className="text-right">Deal</TableHead>
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
