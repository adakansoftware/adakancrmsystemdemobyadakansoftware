import Link from 'next/link'
import { FileText, Handshake, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDealsPageData } from '@/lib/crm/queries'
import { createEnumLabels } from '@/lib/i18n/enums'
import { getI18n } from '@/lib/i18n/server'
import { displayStageName } from '@/lib/i18n/stages'
import { dealStatusMeta } from '@/lib/ui-meta'
import { formatCurrency, formatDate } from '@/lib/format'

export default async function QuotesPage() {
  const { t, locale } = await getI18n()
  const labels = createEnumLabels(t)
  const deals = await getDealsPageData()
  const currentTime = new Date()
  const quoteDeals = deals.filter(
    (deal) =>
      deal.stageKey === 'proposal' ||
      deal.stageKey === 'negotiation' ||
      // Name fallback for custom pipelines without stage keys.
      ['Teklif', 'Pazarlik', 'Gorusme', 'Proposal', 'Negotiation'].some((label) =>
        deal.stage.toLocaleLowerCase('tr-TR').includes(label.toLocaleLowerCase('tr-TR')),
      ),
  )
  const totalValue = quoteDeals.reduce((sum, deal) => sum + deal.amount, 0)
  const weightedValue = quoteDeals.reduce(
    (sum, deal) => sum + (deal.amount * Math.max(deal.probability, 1)) / 100,
    0,
  )
  const dueSoon = quoteDeals.filter((deal) => {
    if (!deal.expectedCloseAt) {
      return false
    }

    const diffDays =
      (deal.expectedCloseAt.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 14
  }).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('quotes.title')}
        description={t('quotes.description')}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/anlasmalar">
              <Handshake data-icon="inline-start" />
              {t('quotes.allDeals')}
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/anlasmalar?quickCreate=deal">
              <FileText data-icon="inline-start" />
              {t('quotes.newQuote')}
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label={t('quotes.activeCount')} value={quoteDeals.length} />
        <SummaryCard label={t('quotes.totalValue')} value={formatCurrency(totalValue, 'TRY', locale)} />
        <SummaryCard
          label={t('quotes.weightedPipeline')}
          value={formatCurrency(weightedValue, 'TRY', locale)}
          badge={t('quotes.dueSoonCloses', { count: dueSoon })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            {t('quotes.priorityList')}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.colTitle')}</TableHead>
                <TableHead>{t('common.colCompanyContact')}</TableHead>
                <TableHead>{t('common.colStage')}</TableHead>
                <TableHead className="text-right">{t('common.colAmount')}</TableHead>
                <TableHead className="text-right">{t('common.colProbability')}</TableHead>
                <TableHead className="text-right">{t('common.expectedClose')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {t('quotes.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                quoteDeals
                  .slice()
                  .sort((left, right) => right.probability - left.probability)
                  .map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <Link href={`/anlasmalar/${deal.id}`} className="font-medium hover:underline">
                          {deal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{deal.company}</span>
                          <span className="text-xs text-muted-foreground">{deal.contact}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={dealStatusMeta[deal.status].variant}>
                            {labels.dealStatus[deal.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {displayStageName({ name: deal.stage, key: deal.stageKey }, t)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(deal.amount, deal.currency, locale)}
                      </TableCell>
                      <TableCell className="text-right">%{deal.probability}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(deal.expectedCloseAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
