'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Building2, Handshake, MapPin, SearchX, Users } from 'lucide-react'
import { deleteCompanyAction, updateCompanyAction } from '@/app/actions/crm'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useI18n, useEnumLabels } from '@/components/i18n/locale-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import type { CompanyRow, UserOption } from '@/lib/crm/view-models'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

const companyStatusVariants = {
  ACTIVE: 'success' as const,
  INACTIVE: 'secondary' as const,
  PROSPECT: 'warning' as const,
  ARCHIVED: 'outline' as const,
}

function CompanyManagementDialog({
  company,
  users,
}: {
  company: CompanyRow
  users: UserOption[]
}) {
  const { isPending, runServerAction } = useServerActionToast()
  const { t, locale } = useI18n()
  const labels = useEnumLabels()
  const companyStatusOptions = [
    { value: 'ACTIVE', label: labels.companyStatus.ACTIVE },
    { value: 'INACTIVE', label: labels.companyStatus.INACTIVE },
    { value: 'PROSPECT', label: labels.companyStatus.PROSPECT },
    { value: 'ARCHIVED', label: labels.companyStatus.ARCHIVED },
  ]
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

  function saveCompany() {
    runServerAction(
      () =>
        updateCompanyAction({
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
        }),
      {
        successMessage: t('companies.updated'),
        errorMessage: t('companies.updateFailed'),
      },
    )
  }

  function archiveCompany() {
    runServerAction(() => deleteCompanyAction({ id: company.id }), {
      successMessage: t('companies.archived'),
      errorMessage: t('companies.archiveFailed'),
    })
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>{t('companies.detail')}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company.name}</DialogTitle>
          <DialogDescription>{t('companies.dialogDescription')}</DialogDescription>
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
                <span>{t('companies.nameLabel')}</span>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.legalNameLabel')}</span>
                <Input
                  value={form.legalName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, legalName: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.email')}</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('contacts.phone')}</span>
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.website')}</span>
                <Input
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, website: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.industry')}</span>
                <Input
                  value={form.industry}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, industry: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.city')}</span>
                <Input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.country')}</span>
                <Input
                  value={form.country}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, country: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>{t('companies.employeeCount')}</span>
                <Input
                  value={form.employeeCount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, employeeCount: event.target.value }))
                  }
                />
              </label>
              <div className="space-y-2 text-sm">
                <span>{t('common.colStatus')}</span>
                <InlineSelectField
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      status: value as CompanyRow['status'],
                    }))
                  }
                  ariaLabel={t('companies.statusAria')}
                  options={companyStatusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>
              <div className="space-y-2 text-sm md:col-span-2">
                <span>{t('contacts.owner')}</span>
                <InlineSelectField
                  value={form.ownerId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, ownerId: value }))
                  }
                  ariaLabel={t('companies.ownerAria')}
                  options={[
                    { value: 'unassigned', label: t('common.unassigned') },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </div>
              <label className="space-y-2 text-sm md:col-span-2">
                <span>{t('companies.address')}</span>
                <Textarea
                  value={form.addressLine1}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      addressLine1: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('contacts.quickSummary')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('companies.summaryCounts', {
                    contacts: company.relatedCustomers,
                    deals: company.activeDeals,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('companies.totalDealValue', {
                    value: formatCurrency(company.totalValue, 'TRY', locale),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={archiveCompany} disabled={isPending}>
                  {t('contacts.archive')}
                </Button>
                <Button onClick={saveCompany} disabled={isPending}>
                  {isPending ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <EntityNotesPanel
              notes={company.notes}
              target={{ companyId: company.id }}
              emptyLabel={t('companies.noNotes')}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <EntityActivityComposer target={{ companyId: company.id }} />
            <EntityActivityFeed
              activities={company.activities}
              emptyLabel={t('companies.noActivities')}
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
  const { t, locale } = useI18n()
  const labels = useEnumLabels()

  if (companies.length === 0) {
    return (
      <Card>
        <Empty className="border-0 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>{t('companies.noMatch')}</EmptyTitle>
            <EmptyDescription>{t('companies.noMatchDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {companies.map((company) => (
        <Card key={company.id} className="gap-0">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5.5" />
                </span>
                <div className="flex flex-col">
                  <CardTitle className="text-base">
                    <Link href={`/firmalar/${company.id}`} className="hover:underline">
                      {company.name}
                    </Link>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{company.id}</span>
                </div>
              </div>
              <Badge variant={companyStatusVariants[company.status]}>
                {labels.companyStatus[company.status]}
              </Badge>
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
                  <span className="text-xs text-muted-foreground">{t('companies.contactsShort')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Handshake className="size-4 text-muted-foreground" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{company.activeDeals}</span>
                  <span className="text-xs text-muted-foreground">{t('companies.activeDealsShort')}</span>
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
              <span className="text-sm font-semibold">
                {formatCurrency(company.totalValue, 'TRY', locale)}
              </span>
              <CompanyManagementDialog company={company} users={users} />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
