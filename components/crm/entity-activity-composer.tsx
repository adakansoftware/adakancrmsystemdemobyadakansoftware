'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createActivityAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useEnumLabels, useI18n } from '@/components/i18n/locale-provider'

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
  const labels = useEnumLabels()
  const { t } = useI18n()
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
          throw new Error(t('activity.saveFailed'))
        }

        setSubject('')
        setDescription('')
        toast.success(t('activity.added'))
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('activity.addFailed'))
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <InlineSelectField
        value={type}
        onValueChange={setType}
        ariaLabel={t('activity.typeAria')}
        options={activityTypes.map((value) => ({
          value,
          label: labels.activityType[value],
        }))}
      />
      <Input
        placeholder={t('activity.subjectPlaceholder')}
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <Textarea
        placeholder={t('activity.descriptionPlaceholder')}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={submitActivity} disabled={isPending || subject.trim().length < 2}>
          {isPending ? t('common.saving') : t('activity.add')}
        </Button>
      </div>
    </div>
  )
}
