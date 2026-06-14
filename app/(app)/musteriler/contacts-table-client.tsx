'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  deleteContactAction,
  updateContactAction,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ContactRow, UserOption } from '@/lib/crm/view-models'
import { formatCurrency, formatDate } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

type CompanyOption = {
  id: string
  name: string
}

type ContactManagementDialogProps = {
  contact: ContactRow
  users: UserOption[]
  companies: CompanyOption[]
}

function ContactManagementDialog({
  contact,
  users,
  companies,
}: ContactManagementDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    jobTitle: contact.jobTitle === '-' ? '' : contact.jobTitle,
    email: contact.email === '-' ? '' : contact.email,
    phone: contact.phone === '-' ? '' : contact.phone,
    mobilePhone: contact.mobilePhone,
    companyId: contact.companyId ?? 'none',
    ownerId: contact.ownerId ?? 'unassigned',
  })

  function refresh(message: string) {
    toast.success(message)
    router.refresh()
  }

  function saveContact() {
    startTransition(async () => {
      try {
        const result = await updateContactAction({
          id: contact.id,
          firstName: form.firstName,
          lastName: form.lastName,
          jobTitle: form.jobTitle.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          mobilePhone: form.mobilePhone.trim() || null,
          companyId: form.companyId === 'none' ? null : form.companyId,
          ownerId: form.ownerId === 'unassigned' ? null : form.ownerId,
        })

        if (!result.success) {
          throw new Error('Musteri guncellenemedi')
        }

        refresh('Musteri guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Musteri guncellenemedi')
      }
    })
  }

  function archiveContact() {
    startTransition(async () => {
      try {
        const result = await deleteContactAction({ id: contact.id })
        if (!result.success) {
          throw new Error('Musteri arsivlenemedi')
        }

        refresh('Musteri arsive tasindi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Musteri arsivlenemedi')
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Yonet</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact.name}</DialogTitle>
          <DialogDescription>
            Kayit bilgilerini guncelle, not ekle ve aktivite gecmisini yonet.
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
                <span>Ad</span>
                <Input
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Soyad</span>
                <Input
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Unvan</span>
                <Input
                  value={form.jobTitle}
                  onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>E-posta</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Telefon</span>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Mobil</span>
                <Input
                  value={form.mobilePhone}
                  onChange={(event) => setForm((current) => ({ ...current, mobilePhone: event.target.value }))}
                />
              </label>
              <div className="space-y-2 text-sm">
                <span>Firma</span>
                <InlineSelectField
                  value={form.companyId}
                  onValueChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
                  ariaLabel="Musteri firmasi"
                  options={[
                    { value: 'none', label: 'Firma bagli degil' },
                    ...companies.map((company) => ({ value: company.id, label: company.name })),
                  ]}
                />
              </div>
              <div className="space-y-2 text-sm">
                <span>Sorumlu</span>
                <InlineSelectField
                  value={form.ownerId}
                  onValueChange={(value) => setForm((current) => ({ ...current, ownerId: value }))}
                  ariaLabel="Musteri sorumlusu"
                  options={[
                    { value: 'unassigned', label: 'Atanmamis' },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Hizli ozet</p>
                <p className="text-xs text-muted-foreground">
                  Son aktivite: {contact.lastActivitySubject}
                </p>
                <p className="text-xs text-muted-foreground">
                  Acik deal katkisi: {formatCurrency(contact.relatedDealValue)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={archiveContact} disabled={isPending}>
                  Arsivle
                </Button>
                <Button onClick={saveContact} disabled={isPending}>
                  {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <EntityNotesPanel
              notes={contact.notes}
              target={{ companyId: contact.companyId, contactId: contact.id }}
              emptyLabel="Bu musteri icin henuz not yok."
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <EntityActivityComposer target={{ companyId: contact.companyId, contactId: contact.id }} />
            <EntityActivityFeed
              activities={contact.activities}
              emptyLabel="Bu musteri icin henuz aktivite kaydi yok."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function ContactsTableClient({
  contacts,
  users,
  companies,
}: {
  contacts: ContactRow[]
  users: UserOption[]
  companies: CompanyOption[]
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Musteri</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead className="max-lg:hidden">Telefon</TableHead>
              <TableHead className="max-xl:hidden">Eklenme</TableHead>
              <TableHead className="text-right">Ilgili Deal</TableHead>
              <TableHead className="text-right">Islem</TableHead>
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
                      <Link href={`/musteriler/${contact.id}`} className="font-medium hover:underline">
                        {contact.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{contact.industry}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{contact.company}</span>
                    <span className="text-xs text-muted-foreground">
                      {contact.jobTitle || contact.city}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell className="max-lg:hidden">{contact.phone}</TableCell>
                <TableCell className="max-xl:hidden">{formatDate(contact.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{formatCurrency(contact.relatedDealValue)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ContactManagementDialog contact={contact} users={users} companies={companies} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
