'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateContactAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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
    startTransition(async () => {
      try {
        const result = await updateContactAction({
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
        })

        if (!result.success) {
          throw new Error('Kisi bilgileri guncellenemedi')
        }

        toast.success('Kisi bilgileri guncellendi')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Kisi guncellenemedi')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kisi Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="space-y-1.5 text-sm">
          <span>Ad</span>
          <Input
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>Soyad</span>
          <Input
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>Unvan</span>
          <Input
            value={form.jobTitle}
            onChange={(event) => setForm((current) => ({ ...current, jobTitle: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>E-posta</span>
          <Input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>Telefon</span>
          <Input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>Mobil</span>
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
          <span>Firma</span>
          <InlineSelectField
            value={form.companyId}
            onValueChange={(value) => setForm((current) => ({ ...current, companyId: value }))}
            ariaLabel="Kisinin bagli oldugu firma"
            options={[
              { value: 'none', label: 'Firma bagli degil' },
              ...companies.map((company) => ({ value: company.id, label: company.name })),
            ]}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>Sorumlu</span>
          <InlineSelectField
            value={form.ownerId}
            onValueChange={(value) => setForm((current) => ({ ...current, ownerId: value }))}
            ariaLabel="Kisi sorumlusu"
            options={[
              { value: 'unassigned', label: 'Atanmamis' },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
        </div>

        <Button onClick={save} disabled={isPending} className="w-full">
          {isPending ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
        </Button>
      </CardContent>
    </Card>
  )
}
