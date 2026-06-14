import { KanbanSquare, Plus, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import Link from 'next/link'
import { DealsTableClient } from '@/app/(app)/anlasmalar/deals-table-client'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { getAssignableUsers, getDealsPageData } from '@/lib/crm/queries'
import { dealStatusLabels } from '@/lib/ui-meta'
import { formatCurrency } from '@/lib/format'

const PAGE_SIZE = 25

type DealsPageSearchParams = {
  q?: string
  status?: string
  owner?: string
  sort?: string
  page?: string
}

function buildDealsUrl(params: DealsPageSearchParams) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() !== '') {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return query ? `/anlasmalar?${query}` : '/anlasmalar'
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<DealsPageSearchParams>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const statusFilter = params.status?.trim() ?? ''
  const ownerFilter = params.owner?.trim() ?? ''
  const sort = params.sort === 'value-desc' ? 'value-desc' : 'close-asc'
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const [deals, users] = await Promise.all([getDealsPageData(), getAssignableUsers()])

  const filteredDeals = deals
    .filter((deal) => {
      const matchesQuery =
        query.length === 0 ||
        [deal.title, deal.company, deal.contact, deal.owner, deal.stage]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())

      const matchesStatus = statusFilter.length === 0 || deal.status === statusFilter
      const matchesOwner = ownerFilter.length === 0 || (deal.ownerId ?? 'unassigned') === ownerFilter

      return matchesQuery && matchesStatus && matchesOwner
    })
    .sort((left, right) => {
      if (sort === 'value-desc') {
        return right.amount - left.amount
      }

      const leftValue = left.expectedCloseAt?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightValue = right.expectedCloseAt?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftValue - rightValue
    })

  const openValue = filteredDeals
    .filter((deal) => deal.status === 'OPEN')
    .reduce((sum, deal) => sum + deal.amount, 0)
  const wonValue = filteredDeals
    .filter((deal) => deal.status === 'WON')
    .reduce((sum, deal) => sum + deal.amount, 0)
  const openDeals = filteredDeals.filter((deal) => deal.status === 'OPEN').length
  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pageStart = (page - 1) * PAGE_SIZE
  const paginatedDeals = filteredDeals.slice(pageStart, pageStart + PAGE_SIZE)
  const selectedOwner = users.find((user) => user.id === ownerFilter)

  return (
    <>
      <PageHeader
        title="Anlasmalar"
        description="Satis hunisini kaybetmeden tum deal kayitlarini filtreleyin, onceliklendirin ve guncelleyin."
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
        <SummaryCard label="Toplam Anlasma" value={filteredDeals.length} badge={`${openDeals} acik`} />
        <SummaryCard label="Acik Deal Degeri" value={formatCurrency(openValue)} />
        <SummaryCard
          label="Kazanilan Deger"
          value={formatCurrency(wonValue)}
          valueClassName="text-2xl font-semibold text-success"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Search className="size-4" />
                Arama
              </span>
              <Input name="q" defaultValue={query} placeholder="Deal, firma, kisi veya asama" />
            </label>

            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="size-4" />
                Durum
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Tum durumlar</option>
                {Object.entries(dealStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <UserRound className="size-4" />
                Sorumlu
              </span>
              <select
                name="owner"
                defaultValue={ownerFilter}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Tum sorumlular</option>
                <option value="unassigned">Atanmamis</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Siralama</span>
              <select
                name="sort"
                defaultValue={sort}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="close-asc">Tahmini kapanisa gore</option>
                <option value="value-desc">Tutara gore</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">Uygula</Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/anlasmalar">Temizle</Link>}
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredDeals.length} kayit bulundu</span>
            <Badge variant="secondary">Sayfa {page} / {totalPages}</Badge>
            {statusFilter ? <Badge variant="outline">{dealStatusLabels[statusFilter as keyof typeof dealStatusLabels]}</Badge> : null}
            {selectedOwner ? <Badge variant="outline">{selectedOwner.name}</Badge> : null}
            {ownerFilter === 'unassigned' ? <Badge variant="outline">Atanmamis</Badge> : null}
            {query ? <Badge variant="outline">Arama: {query}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {paginatedDeals.length === 0 ? (
        <Card>
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Eslesen anlasma bulunamadi</EmptyTitle>
              <EmptyDescription>
                Filtreleri gevsetin ya da yeni bir anlasma kaydi olusturun.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="overflow-x-auto">
            <DealsTableClient deals={paginatedDeals} users={users} />
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDeals.length === 0
            ? 'Gosterilecek anlasma yok.'
            : `${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filteredDeals.length)} arasi kayitlar gosteriliyor.`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildDealsUrl({
                  q: query || undefined,
                  status: statusFilter || undefined,
                  owner: ownerFilter || undefined,
                  sort,
                  page: String(Math.max(1, page - 1)),
                })}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
              >
                Onceki
              </Link>
            }
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={buildDealsUrl({
                  q: query || undefined,
                  status: statusFilter || undefined,
                  owner: ownerFilter || undefined,
                  sort,
                  page: String(Math.min(totalPages, page + 1)),
                })}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
              >
                Sonraki
              </Link>
            }
          />
        </div>
      </div>
    </>
  )
}
