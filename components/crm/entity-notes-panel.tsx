'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createNoteAction, deleteNoteAction, updateNoteAction } from '@/app/actions/crm'
import { useI18n } from '@/components/i18n/locale-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/format'
import type { EntityNoteViewModel } from '@/lib/crm/view-models'

type NoteTarget = {
  companyId?: string | null
  contactId?: string | null
  leadId?: string | null
  dealId?: string | null
  taskId?: string | null
}

export function EntityNotesPanel({
  notes,
  target,
  emptyLabel,
}: {
  notes: EntityNoteViewModel[]
  target: NoteTarget
  emptyLabel: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function refresh(message: string) {
    toast.success(message)
    router.refresh()
  }

  function submitNote() {
    startTransition(async () => {
      try {
        const result = await createNoteAction({
          ...target,
          title: title.trim() || null,
          body,
        })

        if (!result.success) {
          throw new Error(t('notes.saveFailed'))
        }

        setTitle('')
        setBody('')
        refresh(t('notes.added'))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('notes.addFailed'))
      }
    })
  }

  function togglePin(note: EntityNoteViewModel) {
    startTransition(async () => {
      try {
        const result = await updateNoteAction({
          id: note.id,
          isPinned: !note.isPinned,
        })

        if (!result.success) {
          throw new Error(t('notes.pinUpdateFailed'))
        }

        refresh(note.isPinned ? t('notes.unpinned') : t('notes.pinned'))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('notes.updateFailed'))
      }
    })
  }

  function removeNote(noteId: string) {
    startTransition(async () => {
      try {
        const result = await deleteNoteAction({ id: noteId })
        if (!result.success) {
          throw new Error(t('notes.deleteFailed'))
        }

        refresh(t('notes.deleted'))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('notes.deleteFailed'))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border p-4">
        <Input
          placeholder={t('notes.titlePlaceholder')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          placeholder={t('notes.bodyPlaceholder')}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={submitNote} disabled={isPending || body.trim().length === 0}>
            {isPending ? t('common.saving') : t('notes.add')}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{note.title ?? t('notes.defaultTitle')}</p>
                    {note.isPinned ? (
                      <span className="text-xs text-muted-foreground">
                        {t('notes.pinnedLabel')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {note.authorName} · {formatDateTime(note.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => togglePin(note)}
                    disabled={isPending}
                    aria-label={note.isPinned ? t('notes.unpinAria') : t('notes.pinAria')}
                  >
                    {note.isPinned ? <PinOff /> : <Pin />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeNote(note.id)}
                    disabled={isPending}
                    aria-label={t('notes.deleteAria')}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
