import { Download, Mail, MapPin, Phone, Plus } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
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
import { getContactsPageData } from '@/lib/crm/queries'
import { formatCurrency, formatRelativeDate } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

export default async function CustomersPage() {
  const contacts = await getContactsPageData()

  return (
    <>
      <PageHeader
        title="Müşteriler"
        description="Tüm müşteri ilişkilerini gerçek verilerle yönetin"
      >
        <Button
          variant="outline"
          render={
            <Link href="/api/export?entity=contacts">
              <Download data-icon="inline-start" />
              Dışa Aktar
            </Link>
          }
        />
        <Button
          render={
            <Link href="/musteriler?quickCreate=contact">
              <Plus data-icon="inline-start" />
              Yeni Müşteri
            </Link>
          }
        />
      </PageHeader>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead className="max-lg:hidden">İletişim</TableHead>
                <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                <TableHead className="max-lg:hidden">Son Aktivite</TableHead>
                <TableHead className="text-right">İlgili Deal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {contact.industry}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{contact.company}</span>
                      <span className="text-xs text-muted-foreground">{contact.city}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-lg:hidden">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5" />
                        <span>{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5" />
                        <span>{contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5" />
                        <span>{contact.city}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-xl:hidden">{contact.owner}</TableCell>
                  <TableCell className="max-lg:hidden">
                    <div className="flex flex-col">
                      <span className="text-sm">{contact.lastActivitySubject}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(contact.lastActivityAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {formatCurrency(contact.relatedDealValue)}
                    </Badge>
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
