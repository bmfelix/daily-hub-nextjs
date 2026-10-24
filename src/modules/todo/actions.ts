'use server'

import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'

export async function addTask(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) redirect('/todo?error=empty')

  const payload = await getPayloadClient()
  await payload.create({ collection: 'tasks', data: { title } })
  redirect('/todo')
}

export async function toggleTask(formData: FormData) {
  const payload = await getPayloadClient()
  const id = Number(formData.get('task'))
  const task = await payload.findByID({ collection: 'tasks', id })
  await payload.update({ collection: 'tasks', id, data: { done: !task.done } })
  redirect('/todo')
}

export async function deleteTask(formData: FormData) {
  const payload = await getPayloadClient()
  await payload.delete({ collection: 'tasks', id: Number(formData.get('task')) })
  redirect('/todo')
}
