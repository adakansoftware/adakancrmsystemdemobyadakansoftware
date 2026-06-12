'use client'

import { useState } from 'react'
import { KanbanSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { SummaryCard } from '@/components/shared/summary-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  dealStageMeta,
  deals,
  dealStages,
  formatCurrency,
  priorityMeta,
  type BadgeVariant,
  type Deal,
  type DealStage,
} from '@/lib/data'
import { matchesQuery } from '@/lib/helpers'
import { cn } from '@/lib/utils'

type StageFilter = DealStage | 'all'

const stageBadge: Record<Deal['stage'], BadgeVariant> = {
  'Yeni Fırsat': 'secondary',
  Görüşme: 'info',
  Teklif: 'info',
  Pazarlık: 'warning',
  Kazanıldı: 'success',
  Kaybedildi: 'destructive',
}

export default function DealsPage() {
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<StageFilter>('all')

  const filteredDeals = deals.filter((deal) => {
    const matchesStage = stage === 'all' || deal.stage === stage
    return matchesStage && matchesQuery([deal.title, deal.company], query)
  })

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.amount, 0)
  const wonValue = deals
    .filter((deal) => deal.stage === 'Kazanıldı')
    .reduce((sum, deal) => sum + deal.amount, 0)

  return (
    <>
      <PageHeader
        title="Anlaşmalar"
        description="Tüm satış anlaşmalarınızın listesi"
      >
        <Button
          variant="outline"
          render={
            <Link href="/pipeline">
              <KanbanSquare data-icon="inline-start" />
              Pipeline Görünümü
            </Link>
          }
        />
        <Button>
          <Plus data-icon="inline-start" />
          Yeni Anlaşma
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Toplam Anlaşma" value={deals.length} />
        <SummaryCard
          label="Açık Anlaşma Değeri"
          value={formatCurrency(totalValue)}
        />
        <SummaryCard
          label="Kazanılan Değer"
          value={formatCurrency(wonValue)}
          valueClassName="text-2xl font-semibold text-success"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Anlaşma veya firma ara..."
            className="flex-1"
          />
          <Select
            value={stage}
            onValueChange={(value) => setStage(value as StageFilter)}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Aşama" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tüm Aşamalar</SelectItem>
                {dealStages.map((dealStage) => (
                  <SelectItem key={dealStage} value={dealStage}>
                    {dealStage}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anlaşma</TableHead>
                <TableHead className="max-lg:hidden">Aşama</TableHead>
                <TableHead className="max-md:hidden">Öncelik</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                <TableHead className="text-right max-sm:hidden">Termin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{deal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {deal.company}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-lg:hidden">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          dealStageMeta[deal.stage].dot,
                        )}
                      />
                      <Badge variant={stageBadge[deal.stage]}>{deal.stage}</Badge>
                    </span>
                  </TableCell>
                  <TableCell className="max-md:hidden">
                    <Badge variant={priorityMeta[deal.priority].variant}>
                      {deal.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(deal.amount)}
                  </TableCell>
                  <TableCell className="max-xl:hidden">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                          {deal.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {deal.owner}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground max-sm:hidden">
                    {deal.dueDate}
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
