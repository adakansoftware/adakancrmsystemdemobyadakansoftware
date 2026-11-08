'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  deleteContactAction,
  updateContactAction,
} from '@/app/actions/crm'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useI18n } from '@/components/i18n/locale-provider'
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
import { useServerActionToast } from '@/hooks/use-server-action-toast'
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
  const { isPending, runServerAction } = useServerActionToast()
  const { t, locale } = useI18n()
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

  function saveContact() {
    runServerAction(
      () =>
        updateContactAction({
          id: contact.id,
          firstName: form.firstName,
          lastName: form.lastName,
          jobTitle: form.jobTitle.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          mobilePhone: form.mobilePhone.trim() || null,
          companyId: form.companyId === 'none' ? null : form.companyId,
          ownerId: form.ownerId === 'unassigned' ? null : form.ownerId,
        }),
      {
        successMessage: t('contacts.updated'),
        errorMessage: t('contacts.updateFailed'),
      },
    )
  }

  function archiveContact() {
    runServerAction(() => deleteContactAction({ id: contact.id }), {
      successMessage: t('contacts.archived'),
      errorMessage: t('contacts.archiveFailed'),
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>{t('contacts.manage')}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact.name}</DialogTitle>
          <DialogDescription>{t('contacts.dialogDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('contacts.tabGeneral')}</TabsTrigger>
            <TabsTrigger value="notes">{t('contacts.tabNotes')}</TabsTrigger>
            <TabsTrigger value="activity">{t('contacts.tabActivity')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>{t('contacts.firstName')}</span>
                <Input
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.lastName')}</span>
                <Input
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.jobTitle')}</span>
                <Input
                  value={form.jobTitle}
                  onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.email')}</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.phone')}</span>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.mobile')}</span>
                <Input
                  value={form.mobilePhone}
                  onChange={(event) => setForm((current) => ({ ...current, mobilePhone: event.target.value }))}
                />
              </label>
              <div className="space-y-2 text-sm">
                <span>{t('contacts.company')}</span>
                <InlineSelectField
                  value={form.companyId}
                  onValueChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
                  ariaLabel={t('contacts.companyAria')}
                  options={[
                    { value: 'none', label: t('contacts.noCompanyOption') },
                    ...companies.map((company) => ({ value: company.id, label: company.name })),
                  ]}
                />
              </div>
              <div className="space-y-2 text-sm">
                <span>{t('contacts.owner')}</span>
                <InlineSelectField
                  value={form.ownerId}
                  onValueChange={(value) => setForm((current) => ({ ...current, ownerId: value }))}
                  ariaLabel={t('contacts.ownerAria')}
                  options={[
                    { value: 'unassigned', label: t('common.unassigned') },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('contacts.quickSummary')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('contacts.lastActivity', { subject: contact.lastActivitySubject })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('contacts.openDealContribution', {
                    value: formatCurrency(contact.relatedDealValue, 'TRY', locale),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={archiveContact} disabled={isPending}>
                  {t('contacts.archive')}
                </Button>
                <Button onClick={saveContact} disabled={isPending}>
                  {isPending ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <EntityNotesPanel
              notes={contact.notes}
              target={{ companyId: contact.companyId, contactId: contact.id }}
              emptyLabel={t('contacts.noNotes')}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <EntityActivityComposer target={{ companyId: contact.companyId, contactId: contact.id }} />
            <EntityActivityFeed
              activities={contact.activities}
              emptyLabel={t('contacts.noActivities')}
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
  const { t, locale } = useI18n()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contacts.colCustomer')}</TableHead>
              <TableHead>{t('contacts.colCompany')}</TableHead>
              <TableHead>{t('contacts.colEmail')}</TableHead>
              <TableHead className="max-lg:hidden">{t('contacts.colPhone')}</TableHead>
              <TableHead className="max-xl:hidden">{t('contacts.colAdded')}</TableHead>
              <TableHead className="text-right">{t('contacts.colRelatedDeal')}</TableHead>
              <TableHead className="text-right">{t('contacts.colAction')}</TableHead>
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
                <TableCell className="max-xl:hidden">{formatDate(contact.createdAt, locale)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">
                    {formatCurrency(contact.relatedDealValue, 'TRY', locale)}
                  </Badge>
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
