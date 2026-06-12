'use client'

import { useMemo, useState, useTransition } from 'react'
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

type QuickCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: {
    users: Array<{ id: string; name: string }>
    companies: Array<{ id: string; name: string }>
    contacts: Array<{ id: string; name: string }>
    leads: Array<{ id: string; title: string }>
    pipelines: Array<{
      id: string
      name: string
      stages: Array<{ id: string; name: string }>
    }>
  }
}

type QuickCreateKind = 'company' | 'contact' | 'lead' | 'deal' | 'task'

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
  options,
}: QuickCreateDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<QuickCreateKind>('lead')
  const [form, setForm] = useState<FormState>(initialState)
  const [isPending, startTransition] = useTransition()

  const selectedPipeline = useMemo(
    () =>
      options.pipelines.find(
        (pipeline) => pipeline.id === (form.pipelineId || options.pipelines[0]?.id),
      ) ?? options.pipelines[0],
    [form.pipelineId, options.pipelines],
  )

  function resetForm(kind: QuickCreateKind) {
    setActiveTab(kind)
    setForm({
      ...initialState,
      ownerId: options.users[0]?.id ?? '',
      pipelineId: options.pipelines[0]?.id ?? '',
      stageId: options.pipelines[0]?.stages[0]?.id ?? '',
    })
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

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

          if (!result.success) throw new Error('Firma oluşturulamadı')
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

          if (!result.success) throw new Error('Kişi oluşturulamadı')
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

          if (!result.success) throw new Error('Lead oluşturulamadı')
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

          if (!result.success) throw new Error('Anlaşma oluşturulamadı')
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

          if (!result.success) throw new Error('Görev oluşturulamadı')
        }

        toast.success('Kayıt oluşturuldu', {
          description: 'Yeni kayıt veritabanına başarıyla kaydedildi.',
        })
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        toast.error('İşlem başarısız', {
          description: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.',
        })
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) {
          resetForm(activeTab)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hızlı Oluştur</DialogTitle>
          <DialogDescription>
            Şirket, kişi, lead, anlaşma veya görev kaydını doğrudan CRM veritabanına ekleyin.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => resetForm(value as QuickCreateKind)}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company">Firma</TabsTrigger>
            <TabsTrigger value="contact">Kişi</TabsTrigger>
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="deal">Deal</TabsTrigger>
            <TabsTrigger value="task">Görev</TabsTrigger>
          </TabsList>
        </Tabs>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="qc-name">Başlık / Ad Soyad</FieldLabel>
            <Input
              id="qc-name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder={
                activeTab === 'company' ? 'Örn. Aydın Hafriyat' : 'Örn. Caner Aydın'
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Firma</FieldLabel>
              <Select value={form.companyId} onValueChange={(value) => updateField('companyId', value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
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
                  <SelectValue placeholder="Sorumlu seçin" />
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
                <FieldLabel>Kişi</FieldLabel>
                <Select value={form.contactId} onValueChange={(value) => updateField('contactId', value ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kişi seçin" />
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
              <FieldLabel>Tutar / Değer</FieldLabel>
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
                    <SelectValue placeholder="Pipeline seçin" />
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
                <FieldLabel>Aşama</FieldLabel>
                <Select value={form.stageId || selectedPipeline?.stages[0]?.id} onValueChange={(value) => updateField('stageId', value ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aşama seçin" />
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
                    <SelectValue placeholder="Lead seçin" />
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
              <FieldLabel>Beklenen Kapanış</FieldLabel>
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
            İptal
          </Button>
          <Button onClick={submit} disabled={isPending || !form.name.trim()}>
            {isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
