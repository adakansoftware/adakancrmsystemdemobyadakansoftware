import { Download, Plus } from 'lucide-react'
import Link from 'next/link'
import { LeadsTableClient } from '@/app/(app)/leads/leads-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAssignableUsers, getLeadsPageData } from '@/lib/crm/queries'
import { formatCurrency } from '@/lib/format'

export default async function LeadsPage() {
  const [leads, users] = await Promise.all([getLeadsPageData(), getAssignableUsers()])

  return (
    <>
      <PageHeader
        title="Leads"
        description="Potansiyel musterileri gercek CRM kayitlarindan takip edin"
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/api/export?entity=leads">
              <Download data-icon="inline-start" />
              Disa Aktar
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/leads?quickCreate=lead">
              <Plus data-icon="inline-start" />
              Yeni Lead
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Toplam Lead" value={leads.length} badge="Lead" badgeVariant="info" />
        <SummaryCard
          label="Acik"
          value={leads.filter((lead) => lead.status === 'OPEN').length}
          badge="Durum"
          badgeVariant="info"
        />
        <SummaryCard
          label="Nitelikli"
          value={leads.filter((lead) => lead.status === 'QUALIFIED').length}
          badge="Durum"
          badgeVariant="success"
        />
        <SummaryCard
          label="Tahmini Deger"
          value={formatCurrency(leads.reduce((sum, lead) => sum + lead.estimatedValue, 0))}
          badge="TRY"
          badgeVariant="warning"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <LeadsTableClient leads={leads} users={users} />
        </div>
      </Card>
    </>
  )
}
