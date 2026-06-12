import { Building2, Handshake, MapPin, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
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
import { getCompaniesPageData } from '@/lib/crm/queries'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

export default async function CompaniesPage() {
  const companies = await getCompaniesPageData()

  return (
    <>
      <PageHeader
        title="Firmalar"
        description="Kurumsal hesaplarin tum ozet gorunumu"
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/api/export?entity=companies">CSV Indir</Link>}
        />
        <Button
          nativeButton={false}
          render={
            <Link href="/firmalar?quickCreate=company">
              <Plus data-icon="inline-start" />
              Yeni Firma
            </Link>
          }
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="gap-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5.5" />
                </span>
                <div className="flex flex-col">
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{company.id}</span>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">{company.relatedCustomers}</span>
                    <span className="text-xs text-muted-foreground">Kisi</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="size-4 text-muted-foreground" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold">{company.activeDeals}</span>
                    <span className="text-xs text-muted-foreground">Aktif deal</span>
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
                <span className="text-xs text-muted-foreground">{company.owner}</span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(company.totalValue)}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
