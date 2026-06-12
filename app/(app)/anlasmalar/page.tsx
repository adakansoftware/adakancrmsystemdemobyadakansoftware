import { KanbanSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDealsPageData } from '@/lib/crm/queries'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealStatusLabels, dealStatusMeta } from '@/lib/ui-meta'

export default async function DealsPage() {
  const deals = await getDealsPageData()
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anlasma</TableHead>
                <TableHead className="max-lg:hidden">Firma / Kisi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="max-lg:hidden">Asama</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-right max-md:hidden">Olasilik</TableHead>
                <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                <TableHead className="text-right max-sm:hidden">Kapanis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{deal.title}</span>
                      <span className="text-xs text-muted-foreground">{deal.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-lg:hidden">
                    <div className="flex flex-col">
                      <span>{deal.company}</span>
                      <span className="text-xs text-muted-foreground">{deal.contact}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dealStatusMeta[deal.status].variant}>
                      {dealStatusLabels[deal.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-lg:hidden">{deal.stage}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(deal.amount, deal.currency)}
                  </TableCell>
                  <TableCell className="text-right max-md:hidden">%{deal.probability}</TableCell>
                  <TableCell className="max-xl:hidden">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                          {deal.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{deal.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground max-sm:hidden">
                    {formatDate(deal.expectedCloseAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
