import { Download, Plus } from 'lucide-react'
import Link from 'next/link'
import { LeadsTableClient } from '@/app/(app)/leads/leads-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAssignableUsers, getLeadsPageData } from '@/lib/crm/queries'
import { getI18n } from '@/lib/i18n/server'
import { formatCurrency } from '@/lib/format'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { t, locale } = await getI18n()
  const { q } = await searchParams
  const normalizedQuery = q?.trim().toLowerCase() ?? ''
  const [leads, users] = await Promise.all([getLeadsPageData(), getAssignableUsers()])
  const filteredLeads = normalizedQuery
    ? leads.filter((lead) =>
        [lead.title, lead.company, lead.contact, lead.owner, lead.stage, lead.email, lead.phone]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : leads

  return (
    <>
      <PageHeader
        title={t('leads.title')}
        description={
          normalizedQuery
            ? t('leads.searchResults', { query: q ?? '' })
            : t('leads.description')
        }
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/api/export?entity=leads">
              <Download data-icon="inline-start" />
              {t('leads.export')}
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/leads?quickCreate=lead">
              <Plus data-icon="inline-start" />
              {t('leads.newLead')}
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t('leads.total')} value={filteredLeads.length} badge="Lead" badgeVariant="info" />
        <SummaryCard
          label={t('leads.open')}
          value={filteredLeads.filter((lead) => lead.status === 'OPEN').length}
          badge={t('leads.badgeStatus')}
          badgeVariant="info"
        />
        <SummaryCard
          label={t('leads.qualified')}
          value={filteredLeads.filter((lead) => lead.status === 'QUALIFIED').length}
          badge={t('leads.badgeStatus')}
          badgeVariant="success"
        />
        <SummaryCard
          label={t('leads.estimatedValue')}
          value={formatCurrency(
            filteredLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
            'TRY',
            locale,
          )}
          badge="TRY"
          badgeVariant="warning"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <LeadsTableClient leads={filteredLeads} users={users} />
        </div>
      </Card>
    </>
  )
}
