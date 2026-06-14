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
import { dealStatusLabels, dealStatusMeta } from '@/lib/ui-meta'
import { formatCurrency, formatDate } from '@/lib/format'

export default async function QuotesPage() {
  const deals = await getDealsPageData()
  const currentTime = new Date()
  const quoteDeals = deals.filter((deal) =>
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
        title="Teklifler"
        description="Teklif ve pazarlik asamasindaki anlasmalari yakin takip icin ayrilmis gorunum."
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/anlasmalar">
              <Handshake data-icon="inline-start" />
              Tum Anlasmalar
            </Link>
          }
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/anlasmalar?quickCreate=deal">
              <FileText data-icon="inline-start" />
              Yeni Teklif
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Aktif Teklif" value={quoteDeals.length} />
        <SummaryCard label="Toplam Teklif Degeri" value={formatCurrency(totalValue)} />
        <SummaryCard
          label="Weighted Pipeline"
          value={formatCurrency(weightedValue)}
          badge={`${dueSoon} yaklasan kapanis`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Teklif Oncelik Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Baslik</TableHead>
                <TableHead>Firma / Kisi</TableHead>
                <TableHead>Asama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-right">Olasilik</TableHead>
                <TableHead className="text-right">Tahmini Kapanis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Teklif veya pazarlik asamasinda kayit yok.
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
                            {dealStatusLabels[deal.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{deal.stage}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(deal.amount, deal.currency)}
                      </TableCell>
                      <TableCell className="text-right">%{deal.probability}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(deal.expectedCloseAt)}
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
