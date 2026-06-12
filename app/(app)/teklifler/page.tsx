'use client'

import { useState } from 'react'
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, quoteStatusMeta, quotes } from '@/lib/data'
import { matchesQuery } from '@/lib/helpers'

export default function QuotesPage() {
  const [query, setQuery] = useState('')

  const filteredQuotes = quotes.filter((quote) =>
    matchesQuery([quote.id, quote.customer, quote.company], query),
  )

  const total = quotes.reduce((sum, quote) => sum + quote.amount, 0)
  const accepted = quotes
    .filter((quote) => quote.status === 'Kabul Edildi')
    .reduce((sum, quote) => sum + quote.amount, 0)
  const pending = quotes.filter((quote) => quote.status === 'Gönderildi').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teklifler"
        description="Müşterilere gönderilen tüm teklifleri yönetin"
        actions={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Yeni Teklif
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Toplam Teklif Değeri" value={formatCurrency(total)} />
        <SummaryCard label="Kabul Edilen" value={formatCurrency(accepted)} />
        <SummaryCard label="Bekleyen Teklif" value={pending} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Teklif no, müşteri veya firma ara..."
            className="max-w-sm"
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {quote.id}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {quote.customer}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.company}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(quote.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quoteStatusMeta[quote.status].variant}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.createdAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.validUntil}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`${quote.id} için işlemler`}
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem>Görüntüle</DropdownMenuItem>
                            <DropdownMenuItem>PDF indir</DropdownMenuItem>
                            <DropdownMenuItem>Tekrar gönder</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive">
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
