'use client'

import { useState } from 'react'
import {
  Download,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { customers, formatCurrency, type Customer } from '@/lib/data'
import { getInitials, matchesQuery } from '@/lib/helpers'

export default function CustomersPage() {
  const [query, setQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filteredCustomers = customers.filter((customer) =>
    matchesQuery([customer.name, customer.company, customer.city], query),
  )

  return (
    <>
      <PageHeader
        title="Müşteriler"
        description="Tüm müşterilerinizi tek yerden yönetin"
      >
        <Button variant="outline">
          <Download data-icon="inline-start" />
          Dışa Aktar
        </Button>
        <Button>
          <Plus data-icon="inline-start" />
          Yeni Müşteri
        </Button>
      </PageHeader>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Müşteri, firma veya şehir ara..."
            className="max-w-md"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead className="max-lg:hidden">Şehir</TableHead>
                <TableHead className="max-md:hidden">Etiketler</TableHead>
                <TableHead className="text-right">Toplam Değer</TableHead>
                <TableHead className="max-xl:hidden">Son Etkileşim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-3 text-left"
                      aria-label={`${customer.name} detaylarını aç`}
                    >
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.company}
                        </span>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="max-lg:hidden text-sm text-muted-foreground">
                    {customer.city}
                  </TableCell>
                  <TableCell className="max-md:hidden">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalValue)}
                  </TableCell>
                  <TableCell className="max-xl:hidden text-sm text-muted-foreground">
                    {customer.lastInteraction}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {selectedCustomer ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-primary/12 text-base font-semibold text-primary">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <SheetTitle>{selectedCustomer.name}</SheetTitle>
                    <SheetDescription>{selectedCustomer.company}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-4 pb-6">
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Phone data-icon="inline-start" />
                    Ara
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle data-icon="inline-start" />
                    WhatsApp
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">İletişim Bilgileri</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span>{selectedCustomer.city}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Toplam Anlaşma Değeri
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatCurrency(selectedCustomer.totalValue)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Son Etkileşim
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedCustomer.lastInteraction}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Etiketler</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Notlar</h3>
                  <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                    {selectedCustomer.notes}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Sorumlu Temsilci
                  </span>
                  <span className="text-sm font-medium">
                    {selectedCustomer.owner}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
