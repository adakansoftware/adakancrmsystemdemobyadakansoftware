import { KanbanSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import { DealsTableClient } from '@/app/(app)/anlasmalar/deals-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAssignableUsers, getDealsPageData } from '@/lib/crm/queries'
import { formatCurrency } from '@/lib/format'

export default async function DealsPage() {
  const [deals, users] = await Promise.all([getDealsPageData(), getAssignableUsers()])
  const openValue = deals.filter((deal) => deal.status === 'OPEN').reduce((sum, deal) => sum + deal.amount, 0)
  const wonValue = deals.filter((deal) => deal.status === 'WON').reduce((sum, deal) => sum + deal.amount, 0)

  return (
    <>
      <PageHeader
        title="Anlasmalar"
        description="Tum satis anlasmalarinizi veritabanindan yonetin"
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/pipeline">
              <KanbanSquare data-icon="inline-start" />
              Pipeline Gorunumu
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/anlasmalar?quickCreate=deal">
              <Plus data-icon="inline-start" />
              Yeni Anlasma
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Toplam Anlasma" value={deals.length} />
        <SummaryCard label="Acik Deal Degeri" value={formatCurrency(openValue)} />
        <SummaryCard
          label="Kazanilan Deger"
          value={formatCurrency(wonValue)}
          valueClassName="text-2xl font-semibold text-success"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <DealsTableClient deals={deals} users={users} />
        </div>
      </Card>
    </>
  )
}
