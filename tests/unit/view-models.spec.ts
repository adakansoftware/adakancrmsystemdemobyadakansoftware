import { describe, expect, it } from 'vitest'
import { mapEntityActivities, mapEntityNotes } from '@/lib/crm/queries/shared'

describe('mapEntityNotes', () => {
  it('maps notes with the author name', () => {
    const createdAt = new Date('2026-11-10T10:00:00Z')
    const [note] = mapEntityNotes([
      {
        id: 'note-1',
        title: 'Baslik',
        body: 'Icerik',
        isPinned: true,
        createdAt,
        author: { firstName: 'Ada', lastName: 'Kan' },
      },
    ])

    expect(note).toEqual({
      id: 'note-1',
      title: 'Baslik',
      body: 'Icerik',
      isPinned: true,
      createdAt,
      authorName: 'Ada Kan',
    })
  })

  it('falls back to the system label without an author', () => {
    const [note] = mapEntityNotes([
      {
        id: 'note-2',
        title: null,
        body: 'Icerik',
        isPinned: false,
        createdAt: new Date(),
        author: null,
      },
    ])

    expect(note?.authorName).toBe('common.system')
    expect(note?.title).toBeNull()
  })
})

describe('mapEntityActivities', () => {
  it('maps activities with the actor name', () => {
    const occurredAt = new Date('2026-11-10T09:00:00Z')
    const [activity] = mapEntityActivities([
      {
        id: 'activity-1',
        type: 'CALL',
        subject: 'Gorusme',
        description: 'Detay',
        occurredAt,
        actor: { firstName: 'Caner', lastName: 'Aydin' },
      },
    ])

    expect(activity).toEqual({
      id: 'activity-1',
      type: 'CALL',
      subject: 'Gorusme',
      description: 'Detay',
      occurredAt,
      actorName: 'Caner Aydin',
    })
  })

  it('falls back to the system label without an actor', () => {
    const [activity] = mapEntityActivities([
      {
        id: 'activity-2',
        type: 'SYSTEM',
        subject: 'Otomatik',
        description: null,
        occurredAt: new Date(),
        actor: null,
      },
    ])

    expect(activity?.actorName).toBe('common.system')
    expect(activity?.description).toBeNull()
  })
})
