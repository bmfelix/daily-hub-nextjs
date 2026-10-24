'use server'

import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'

export async function saveNote(formData: FormData) {
  const id = formData.get('note') ? Number(formData.get('note')) : null
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '')
  if (!title) redirect(`/notes?error=empty${id ? `&note=${id}` : ''}`)

  const payload = await getPayloadClient()
  const note = id
    ? await payload.update({ collection: 'notes', id, data: { title, body } })
    : await payload.create({ collection: 'notes', data: { title, body } })
  redirect(`/notes?note=${note.id}`)
}

export async function deleteNote(formData: FormData) {
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'notes', id: Number(formData.get('note')) })
  redirect('/notes')
}
