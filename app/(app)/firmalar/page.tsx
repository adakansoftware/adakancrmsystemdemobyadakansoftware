'use client'

import { useState } from 'react'
import {
  Building2,
  Handshake,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { companies, formatCurrency } from '@/lib/data'
import { getInitials, matchesQuery } from '@/lib/helpers'

type CompanyView = 'grid' | 'list'

export default function CompaniesPage() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<CompanyView>('grid')

  const filteredCompanies = companies.filter((company) =>
    matchesQuery([company.name, company.sector, company.city], query),
  )

  return (
    <>
      <PageHeader
        title="Firmalar"
        description="Kurumsal müşterileriniz ve ilişkili kişiler"
      >
        <Button>
          <Plus data-icon="inline-start" />
          Yeni Firma
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Firma, sektör veya şehir ara..."
          className="max-w-md flex-1"
        />
        <ToggleGroup
          value={[view]}
          onValueChange={(values) => {
            const nextView = values[0] as CompanyView | undefined
            if (nextView) {
              setView(nextView)
            }
          }}
          className="self-start"
        >
          <ToggleGroupItem value="grid" aria-label="Kart görünümü">
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Liste görünümü">
            <List />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="gap-0">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-5.5" />
                  </span>
                  <div className="flex flex-col">
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {company.id}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{company.sector}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {company.city}
                  </span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold">
                        {company.relatedCustomers}
                      </span>
                      <span className="text-xs text-muted-foreground">Kişi</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Handshake className="size-4 text-muted-foreground" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold">
                        {company.activeDeals}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Aktif anlaşma
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                      {getInitials(company.owner)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {company.owner}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(company.totalValue)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead className="max-md:hidden">Sektör</TableHead>
                  <TableHead className="max-lg:hidden">Şehir</TableHead>
                  <TableHead className="text-center">Kişi</TableHead>
                  <TableHead className="text-center">Anlaşma</TableHead>
                  <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                  <TableHead className="text-right">Değer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="max-md:hidden">
                      <Badge variant="info">{company.sector}</Badge>
                    </TableCell>
                    <TableCell className="max-lg:hidden text-sm text-muted-foreground">
                      {company.city}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.relatedCustomers}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.activeDeals}
                    </TableCell>
                    <TableCell className="max-xl:hidden text-sm text-muted-foreground">
                      {company.owner}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(company.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </>
  )
}
