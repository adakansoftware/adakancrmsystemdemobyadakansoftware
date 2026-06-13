'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Handshake, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteCompanyAction,
  updateCompanyAction,
} from '@/app/actions/crm'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { InlineSelectField } from '@/components/crm/inline-select-field'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { CompanyRow, UserOption } from '@/lib/crm/view-models'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

const companyStatusOptions = [
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'INACTIVE', label: 'Pasif' },
  { value: 'PROSPECT', label: 'Aday' },
  { value: 'ARCHIVED', label: 'Arsiv' },
] as const

function CompanyManagementDialog({
  company,
  users,
}: {
  company: CompanyRow
  users: UserOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: company.name,
    legalName: company.legalName,
    email: company.email,
    phone: company.phone,
    website: company.website,
    industry: company.sector === '-' ? '' : company.sector,
    city: company.city === '-' ? '' : company.city,
    country: company.country,
    addressLine1: company.addressLine1,
    employeeCount: company.employeeCount?.toString() ?? '',
    ownerId: company.ownerId ?? 'unassigned',
    status: company.status,
  })

  function refresh(message: string) {
    toast.success(message)
    router.refresh()
  }

  function saveCompany() {
    startTransition(async () => {
      try {
        const result = await updateCompanyAction({
          id: company.id,
          name: form.name,
          legalName: form.legalName.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          industry: form.industry.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          addressLine1: form.addressLine1.trim() || null,
          employeeCount: form.employeeCount.trim() ? Number(form.employeeCount) : null,
          ownerId: form.ownerId === 'unassigned' ? null : form.ownerId,
          status: form.status,
        })

        if (!result.success) {
          throw new Error('Firma guncellenemedi')
        }

        refresh('Firma guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Firma guncellenemedi')
      }
    })
  }

  function archiveCompany() {
    startTransition(async () => {
      try {
        const result = await deleteCompanyAction({ id: company.id })
        if (!result.success) {
          throw new Error('Firma arsivlenemedi')
        }

        refresh('Firma arsive tasindi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Firma arsivlenemedi')
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Detay</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company.name}</DialogTitle>
          <DialogDescription>
            Kurumsal hesap bilgilerini, notlarini ve aktivite akisini yonet.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Genel</TabsTrigger>
            <TabsTrigger value="notes">Notlar</TabsTrigger>
            <TabsTrigger value="activity">Aktivite</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Firma Adi</span>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Yasal Unvan</span>
                <Input value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>E-posta</span>
                <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Telefon</span>
                <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Web Sitesi</span>
                <Input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Sektor</span>
                <Input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Sehir</span>
                <Input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Ulke</span>
                <Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Calisan Sayisi</span>
                <Input value={form.employeeCount} onChange={(event) => setForm((current) => ({ ...current, employeeCount: event.target.value }))} />
              </label>
              <div className="space-y-2 text-sm">
                <span>Durum</span>
                <InlineSelectField
                  value={form.status}
                  onValueChange={(value) => setForm((current) => ({ ...current, status: value as CompanyRow['status'] }))}
                  ariaLabel="Firma durumu"
                  options={companyStatusOptions.map((option) => ({ value: option.value, label: option.label }))}
                />
              </div>
              <div className="space-y-2 text-sm md:col-span-2">
                <span>Sorumlu</span>
                <InlineSelectField
                  value={form.ownerId}
                  onValueChange={(value) => setForm((current) => ({ ...current, ownerId: value }))}
                  ariaLabel="Firma sorumlusu"
                  options={[
                    { value: 'unassigned', label: 'Atanmamis' },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </div>
              <label className="space-y-2 text-sm md:col-span-2">
                <span>Adres</span>
                <Textarea value={form.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))} />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Hizli ozet</p>
                <p className="text-xs text-muted-foreground">
                  {company.relatedCustomers} kisi · {company.activeDeals} aktif deal
                </p>
                <p className="text-xs text-muted-foreground">
                  Toplam deal degeri: {formatCurrency(company.totalValue)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={archiveCompany} disabled={isPending}>
                  Arsivle
                </Button>
                <Button onClick={saveCompany} disabled={isPending}>
                  {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <EntityNotesPanel
              notes={company.notes}
              target={{ companyId: company.id }}
              emptyLabel="Bu firma icin henuz not yok."
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <EntityActivityComposer target={{ companyId: company.id }} />
            <EntityActivityFeed
              activities={company.activities}
              emptyLabel="Bu firma icin henuz aktivite kaydi yok."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function CompaniesGridClient({
  companies,
  users,
}: {
  companies: CompanyRow[]
  users: UserOption[]
}) {
  return (
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
          <CardFooter className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                  {getInitials(company.owner)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{company.owner}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatCurrency(company.totalValue)}</span>
              <CompanyManagementDialog company={company} users={users} />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
