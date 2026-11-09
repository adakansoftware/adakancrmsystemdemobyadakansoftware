'use client'

import { useState } from 'react'
import { updateContactAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useI18n } from '@/components/i18n/locale-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import type { UserOption } from '@/lib/crm/view-models'

type CompanyOption = {
  id: string
  name: string
}

export function ContactDetailClient({
  contact,
  users,
  companies,
}: {
  contact: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    mobilePhone: string
    jobTitle: string
    companyId?: string | null
    ownerId?: string | null
    linkedinUrl: string
  }
  users: UserOption[]
  companies: CompanyOption[]
}) {
  const { isPending, runServerAction } = useServerActionToast()
  const { t } = useI18n()
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email === '-' ? '' : contact.email,
    phone: contact.phone === '-' ? '' : contact.phone,
    mobilePhone: contact.mobilePhone,
    jobTitle: contact.jobTitle === '-' ? '' : contact.jobTitle,
    companyId: contact.companyId ?? 'none',
    ownerId: contact.ownerId ?? 'unassigned',
    linkedinUrl: contact.linkedinUrl,
  })

  function save() {
    runServerAction(
      () =>
        updateContactAction({
          id: contact.id,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          mobilePhone: form.mobilePhone.trim() || null,
          jobTitle: form.jobTitle.trim() || null,
          companyId: form.companyId === 'none' ? null : form.companyId,
          ownerId: form.ownerId === 'unassigned' ? null : form.ownerId,
          linkedinUrl: form.linkedinUrl.trim() || null,
        }),
      {
        successMessage: t('contactDetail.updated'),
        errorMessage: t('contactDetail.updateFailed'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('contactDetail.info')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.firstName')}</span>
          <Input
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.lastName')}</span>
          <Input
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.jobTitle')}</span>
          <Input
            value={form.jobTitle}
            onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.email')}</span>
          <Input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.phone')}</span>
          <Input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('contacts.mobile')}</span>
          <Input
            value={form.mobilePhone}
            onChange={(event) => setForm((current) => ({ ...current, mobilePhone: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>LinkedIn</span>
          <Input
            value={form.linkedinUrl}
            onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))}
          />
        </label>
        <div className="space-y-1.5 text-sm">
          <span>{t('contacts.company')}</span>
          <InlineSelectField
            value={form.companyId}
            onValueChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
            ariaLabel={t('contactDetail.companyAria')}
            options={[
              { value: 'none', label: t('contacts.noCompanyOption') },
              ...companies.map((company) => ({ value: company.id, label: company.name })),
            ]}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>{t('contacts.owner')}</span>
          <InlineSelectField
            value={form.ownerId}
            onValueChange={(value) => setForm((current) => ({ ...current, ownerId: value }))}
            ariaLabel={t('contactDetail.ownerAria')}
            options={[
              { value: 'unassigned', label: t('common.unassigned') },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
        </div>

        <Button onClick={save} disabled={isPending} className="w-full">
          {isPending ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </CardContent>
    </Card>
  )
}
