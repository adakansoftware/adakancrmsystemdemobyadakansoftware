'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  createCompanyAction,
  createContactAction,
  createDealAction,
  createLeadAction,
  createTaskAction,
} from '@/app/actions/crm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { QuickCreateKind, QuickCreateOptions } from '@/lib/crm/view-models'

type QuickCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialKind?: QuickCreateKind
  options: QuickCreateOptions
}

type FormState = {
  name: string
  companyId: string
  contactId: string
  ownerId: string
  source: string
  amount: string
  phone: string
  email: string
  dueAt: string
  pipelineId: string
  stageId: string
  leadId: string
}

const leadSourceOptions = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Referans' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PHONE', label: 'Telefon' },
]

const initialState: FormState = {
  name: '',
  companyId: '',
  contactId: '',
  ownerId: '',
  source: 'WEBSITE',
  amount: '',
  phone: '',
  email: '',
  dueAt: '',
  pipelineId: '',
  stageId: '',
  leadId: '',
}

export function QuickCreateDialog({
  open,
  onOpenChange,
  initialKind = 'lead',
  options,
}: QuickCreateDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<QuickCreateKind>(initialKind)
  const [form, setForm] = useState<FormState>(initialState)
  const [isPending, startTransition] = useTransition()

  const selectedPipeline = useMemo(
    () =>
      options.pipelines.find(
        (pipeline) => pipeline.id === (form.pipelineId || options.pipelines[0]?.id),
      ) ?? options.pipelines[0],
    [form.pipelineId, options.pipelines],
  )

  const initialForm = useMemo<FormState>(
    () => ({
      ...initialState,
      ownerId: options.users[0]?.id ?? '',
      pipelineId: options.pipelines[0]?.id ?? '',
      stageId: options.pipelines[0]?.stages[0]?.id ?? '',
    }),
    [options.pipelines, options.users],
  )

  function resetForm(kind: QuickCreateKind) {
    setActiveTab(kind)
    setForm(initialForm)
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const syncId = window.setTimeout(() => {
      setActiveTab(initialKind)
      setForm(initialForm)
    }, 0)

    return () => window.clearTimeout(syncId)
  }, [initialForm, initialKind, open])

  async function submit() {
    startTransition(async () => {
      try {
        const pipelineId = form.pipelineId || options.pipelines[0]?.id
        const stageId = form.stageId || selectedPipeline?.stages[0]?.id

        if (activeTab === 'company') {
          const result = await createCompanyAction({
            name: form.name,
            email: form.email || null,
            phone: form.phone || null,
            ownerId: form.ownerId || null,
          })
          if (!result.success) throw new Error('Firma olusturulamadi')
        }

        if (activeTab === 'contact') {
          const [firstName, ...rest] = form.name.trim().split(' ')
          const result = await createContactAction({
            firstName: firstName || form.name,
            lastName: rest.join(' ') || '-',
            companyId: form.companyId || null,
            ownerId: form.ownerId || null,
            email: form.email || null,
            phone: form.phone || null,
            mobilePhone: form.phone || null,
          })
          if (!result.success) throw new Error('Kisi olusturulamadi')
        }

        if (activeTab === 'lead') {
          const result = await createLeadAction({
            title: form.name,
            companyId: form.companyId || null,
            contactId: form.contactId || null,
            ownerId: form.ownerId || null,
            pipelineId,
            stageId,
            phone: form.phone || null,
            email: form.email || null,
            source: (form.source as 'WEBSITE' | 'REFERRAL' | 'WHATSAPP' | 'PHONE') || 'WEBSITE',
            estimatedValue: form.amount ? Number(form.amount) : null,
          })
          if (!result.success) throw new Error('Lead olusturulamadi')
        }

        if (activeTab === 'deal') {
          const result = await createDealAction({
            title: form.name,
            companyId: form.companyId || null,
            contactId: form.contactId || null,
            ownerId: form.ownerId || null,
            pipelineId,
            stageId,
            amount: Number(form.amount || 0),
            expectedCloseAt: form.dueAt ? new Date(form.dueAt) : null,
          })
          if (!result.success) throw new Error('Anlasma olusturulamadi')
        }

        if (activeTab === 'task') {
          const result = await createTaskAction({
            title: form.name,
            companyId: form.companyId || null,
            contactId: form.contactId || null,
            leadId: form.leadId || null,
            assigneeId: form.ownerId || null,
            dueAt: form.dueAt ? new Date(form.dueAt) : null,
          })
          if (!result.success) throw new Error('Gorev olusturulamadi')
        }

        toast.success('Kayit olusturuldu', {
          description: 'Yeni kayit veritabanina basariyla kaydedildi.',
        })
        onOpenChange(false)
        window.setTimeout(() => {
          router.refresh()
        }, 0)
      } catch (error) {
        toast.error('Islem basarisiz', {
          description: error instanceof Error ? error.message : 'Beklenmeyen bir hata olustu.',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hizli Olustur</DialogTitle>
          <DialogDescription>
            Sirket, kisi, lead, anlasma veya gorev kaydini dogrudan CRM veritabanina ekleyin.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => resetForm(value as QuickCreateKind)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">Firma</TabsTrigger>
            <TabsTrigger value="contact">Kisi</TabsTrigger>
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="deal">Deal</TabsTrigger>
            <TabsTrigger value="task">Gorev</TabsTrigger>
          </TabsList>
        </Tabs>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="qc-name">Baslik / Ad Soyad</FieldLabel>
            <Input
              id="qc-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder={activeTab === 'company' ? 'Orn. Aydin Hafriyat' : 'Orn. Caner Aydin'}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Firma</FieldLabel>
              <Select value={form.companyId} onValueChange={(value) => updateField('companyId', value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma secin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Sorumlu</FieldLabel>
              <Select value={form.ownerId} onValueChange={(value) => updateField('ownerId', value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sorumlu secin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {activeTab !== 'company' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Kisi</FieldLabel>
                <Select value={form.contactId} onValueChange={(value) => updateField('contactId', value ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kisi secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {options.contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Telefon</FieldLabel>
                <Input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="+90 5xx xxx xx xx"
                />
              </Field>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>E-posta</FieldLabel>
              <Input
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="ornek@firma.com"
              />
            </Field>
            <Field>
              <FieldLabel>Tutar / Deger</FieldLabel>
              <Input
                type="number"
                value={form.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="100000"
              />
            </Field>
          </div>

          {activeTab === 'lead' ? (
            <Field>
              <FieldLabel>Kaynak</FieldLabel>
              <Select value={form.source} onValueChange={(value) => updateField('source', value ?? 'WEBSITE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {leadSourceOptions.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {(activeTab === 'lead' || activeTab === 'deal') ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Pipeline</FieldLabel>
                <Select
                  value={form.pipelineId || options.pipelines[0]?.id}
                  onValueChange={(value) => {
                    const pipeline = options.pipelines.find((item) => item.id === value)
                    updateField('pipelineId', value ?? '')
                    updateField('stageId', pipeline?.stages[0]?.id ?? '')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pipeline secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {options.pipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Asama</FieldLabel>
                <Select value={form.stageId || selectedPipeline?.stages[0]?.id} onValueChange={(value) => updateField('stageId', value ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Asama secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {selectedPipeline?.stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}

          {activeTab === 'task' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Lead</FieldLabel>
                <Select value={form.leadId} onValueChange={(value) => updateField('leadId', value ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lead secin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {options.leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Termin</FieldLabel>
                <Input
                  type="date"
                  value={form.dueAt}
                  onChange={(event) => updateField('dueAt', event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {activeTab === 'deal' ? (
            <Field>
              <FieldLabel>Beklenen Kapanis</FieldLabel>
              <Input
                type="date"
                value={form.dueAt}
                onChange={(event) => updateField('dueAt', event.target.value)}
              />
            </Field>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Iptal
          </Button>
          <Button onClick={submit} disabled={isPending || !form.name.trim()}>
            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
