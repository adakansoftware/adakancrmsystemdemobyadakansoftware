import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardData } from '@/lib/crm/queries'
import { formatCurrency } from '@/lib/format'

export default async function ReportsPage() {
  const data = await getDashboardData()
  const totalWon = data.staffPerformance.reduce((sum, person) => sum + person.revenue, 0)
  const openTasks = data.staffPerformance.reduce((sum, person) => sum + person.taskLoad, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Raporlar"
        description="Temel performans ve operasyon gorunumu"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Toplam Acik Deal" value={data.openDeals} />
        <SummaryCard label="Kazanilan Tutar" value={formatCurrency(totalWon)} />
        <SummaryCard label="Acik Gorev Yuku" value={openTasks} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel Performansi Ozeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.staffPerformance.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span className="font-medium">{person.name}</span>
              <span className="text-muted-foreground">
                {person.deals} acik deal / {person.taskLoad} gorev / %{person.rate} kapanis
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
