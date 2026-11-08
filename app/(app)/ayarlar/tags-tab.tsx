'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { createTagAction, deleteTagAction, updateTagAction } from '@/app/actions/crm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import type { SettingsOverviewData } from '@/lib/crm/queries'
import { ErrorText } from './settings-shared'

const tagFormSchema = z.object({
  name: z.string().trim().min(2, 'Etiket adi en az 2 karakter olmali'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Hex renk girin'),
})

type TagsTabProps = {
  tags: SettingsOverviewData['tags']
}

export function TagsTab({ tags }: TagsTabProps) {
  const { isPending, runServerAction } = useServerActionToast()
  const tagActions = useOptimisticRowAction<string>()
  const [tagEdits, setTagEdits] = useState<Record<string, { name: string; color: string }>>(
    Object.fromEntries(tags.map((tag) => [tag.id, { name: tag.name, color: tag.color }])),
  )

  const createTagForm = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: '#6366f1',
    },
  })

  const handleCreateTag = createTagForm.handleSubmit((values) => {
    runServerAction(() => createTagAction(values), {
      successMessage: 'Etiket olusturuldu',
      errorMessage: 'Etiket olusturulamadi',
      onSuccess: () => {
        createTagForm.reset({
          name: '',
          color: '#6366f1',
        })
      },
    })
  })

  function saveTag(tagId: string) {
    const values = tagEdits[tagId]
    if (!values) {
      return
    }

    const parsed = tagFormSchema.safeParse(values)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Etiket alanlari gecersiz')
      return
    }

    tagActions.runRowAction(
      tagId,
      () =>
        updateTagAction({
          id: tagId,
          ...parsed.data,
        }),
      {
        successMessage: 'Etiket guncellendi',
        errorMessage: 'Etiket guncellenemedi',
      },
    )
  }

  function removeTag(tagId: string) {
    tagActions.runRowAction(tagId, () => deleteTagAction({ id: tagId }), {
      successMessage: 'Etiket silindi',
      errorMessage: 'Etiket silinemedi',
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Etiket Kutuphanesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henuz etiket yok.</p>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]"
              >
                <Input
                  value={tagEdits[tag.id]?.name ?? tag.name}
                  onChange={(event) =>
                    setTagEdits((current) => ({
                      ...current,
                      [tag.id]: {
                        name: event.target.value,
                        color: current[tag.id]?.color ?? tag.color,
                      },
                    }))
                  }
                />
                <Input
                  value={tagEdits[tag.id]?.color ?? tag.color}
                  onChange={(event) =>
                    setTagEdits((current) => ({
                      ...current,
                      [tag.id]: {
                        name: current[tag.id]?.name ?? tag.name,
                        color: event.target.value,
                      },
                    }))
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {tag._count.companies + tag._count.contacts + tag._count.deals} bag
                  </Badge>
                  <Button onClick={() => saveTag(tag.id)} disabled={tagActions.isRowPending(tag.id)}>
                    Kaydet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => removeTag(tag.id)}
                    disabled={tagActions.isRowPending(tag.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Etiket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTag} className="grid gap-4">
            <label className="space-y-2 text-sm">
              <span>Etiket Adi</span>
              <Input {...createTagForm.register('name')} />
              <ErrorText message={createTagForm.formState.errors.name?.message} />
            </label>
            <label className="space-y-2 text-sm">
              <span>Renk</span>
              <Input {...createTagForm.register('color')} />
              <ErrorText message={createTagForm.formState.errors.color?.message} />
            </label>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Olusturuluyor...' : 'Etiket Olustur'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
