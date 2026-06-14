'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createNoteAction, deleteNoteAction, updateNoteAction } from '@/app/actions/crm'
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
          throw new Error('Not kaydedilemedi')
        }

        setTitle('')
        setBody('')
        refresh('Not eklendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Not eklenemedi')
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
          throw new Error('Not sabitleme durumu guncellenemedi')
        }

        refresh(note.isPinned ? 'Not sabitlemeden kaldirildi' : 'Not sabitlendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Not guncellenemedi')
      }
    })
  }

  function removeNote(noteId: string) {
    startTransition(async () => {
      try {
        const result = await deleteNoteAction({ id: noteId })
        if (!result.success) {
          throw new Error('Not silinemedi')
        }

        refresh('Not silindi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Not silinemedi')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border p-4">
        <Input
          placeholder="Not basligi (opsiyonel)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          placeholder="Kayda eklemek istedigin notu yaz"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={submitNote} disabled={isPending || body.trim().length === 0}>
            {isPending ? 'Kaydediliyor...' : 'Not Ekle'}
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
                    <p className="text-sm font-medium">{note.title ?? 'Not'}</p>
                    {note.isPinned ? (
                      <span className="text-xs text-muted-foreground">Sabitlendi</span>
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
                    aria-label={note.isPinned ? 'Notu sabitlemeden kaldir' : 'Notu sabitle'}
                  >
                    {note.isPinned ? <PinOff /> : <Pin />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeNote(note.id)}
                    disabled={isPending}
                    aria-label="Notu sil"
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
