import type {
  EntityActivityViewModel,
  EntityNoteViewModel,
} from '@/lib/crm/view-models'

export function mapEntityNotes(
  notes: Array<{
    id: string
    title: string | null
    body: string
    isPinned: boolean
    createdAt: Date
    author: { firstName: string; lastName: string } | null
  }>,
): EntityNoteViewModel[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    isPinned: note.isPinned,
    createdAt: note.createdAt,
    authorName: note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Sistem',
  }))
}

export function mapEntityActivities(
  activities: Array<{
    id: string
    type: import('@prisma/client').ActivityType
    subject: string
    description: string | null
    occurredAt: Date
    actor: { firstName: string; lastName: string } | null
  }>,
): EntityActivityViewModel[] {
  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    subject: activity.subject,
    description: activity.description,
    occurredAt: activity.occurredAt,
    actorName: activity.actor
      ? `${activity.actor.firstName} ${activity.actor.lastName}`
      : 'Sistem',
  }))
}
