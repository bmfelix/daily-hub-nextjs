import { notFound } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'
import type { Note } from '@/payload-types'

import { HubModule, param, type SearchParams } from '../HubModule'
import { NotesCard } from './NotesCard'
import { NotesView } from './NotesView'

export type NotesData = { notes: Note[]; note: Note | null; error?: string }

export class NotesModule extends HubModule<NotesData, Note | null> {
  readonly slug = 'notes'
  readonly title = 'Notes'
  readonly summary = 'Write, edit, and delete short notes.'
  readonly View = NotesView
  readonly Card = NotesCard

  async card(): Promise<Note | null> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({ collection: 'notes', sort: '-updatedAt', limit: 1 })
    return docs[0] ?? null
  }

  async load(params: SearchParams): Promise<NotesData> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({ collection: 'notes', sort: '-updatedAt', pagination: false })

    const noteId = Number(param(params, 'note'))
    const note = noteId ? docs.find((item) => item.id === noteId) : null
    if (noteId && !note) notFound()

    return {
      notes: docs,
      note: note ?? null,
      error: param(params, 'error') === 'empty' ? 'Enter a note title.' : undefined,
    }
  }
}
