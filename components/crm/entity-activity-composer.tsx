'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createActivityAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { activityTypeMeta } from '@/lib/ui-meta'

const activityTypes = [
  'CALL',
  'EMAIL',
  'MEETING',
  'NOTE',
  'TASK',
  'STATUS_CHANGE',
  'STAGE_CHANGE',
  'COMMENT',
  'SYSTEM',
] as const

type ActivityTarget = {
  companyId?: string | null
  contactId?: string | null
  leadId?: string | null
  dealId?: string | null
  taskId?: string | null
}

export function EntityActivityComposer({
  target,
}: {
  target: ActivityTarget
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<(typeof activityTypes)[number]>('COMMENT')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  function submitActivity() {
    startTransition(async () => {
      try {
        const result = await createActivityAction({
          ...target,
          type,
          subject,
          description: description.trim() || null,
        })

        if (!result.success) {
          throw new Error('Aktivite kaydedilemedi')
        }

        setSubject('')
        setDescription('')
        toast.success('Aktivite eklendi')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Aktivite eklenemedi')
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <InlineSelectField
        value={type}
        onValueChange={setType}
        ariaLabel="Aktivite tipi sec"
        options={activityTypes.map((value) => ({
          value,
          label: activityTypeMeta[value].label,
        }))}
      />
      <Input
        placeholder="Aktivite basligi"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <Textarea
        placeholder="Aktivite aciklamasi (opsiyonel)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={submitActivity} disabled={isPending || subject.trim().length < 2}>
          {isPending ? 'Kaydediliyor...' : 'Aktivite Ekle'}
        </Button>
      </div>
    </div>
  )
}
