import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getMenuPages, getPublishedPage } from '@/lib/pages'
import { getPayloadClient } from '@/lib/payload'
import { MODULES } from '@/modules'
import { MODULE_SLUGS } from '@/modules/slugs'
import { deleteNote, saveNote } from '@/modules/notes/actions'
import { NotesModule } from '@/modules/notes/NotesModule'
import { addTask, deleteTask, toggleTask } from '@/modules/todo/actions'
import { TodoModule } from '@/modules/todo/TodoModule'

// These tests use a real Postgres database. Run them against a test database,
// never the live one: they delete every task, note, and page.

let payload: Payload

const form = (fields: Record<string, string | number>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, String(value))
  return data
}

/** Run a server action and return where it redirected to. */
async function redirectOf(action: Promise<unknown>) {
  try {
    await action
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) return digest.split(';')[2]
    throw error
  }
  throw new Error('Expected a redirect')
}

async function clearAll() {
  for (const collection of ['tasks', 'notes', 'pages'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

beforeAll(async () => {
  payload = await getPayloadClient()
})
beforeEach(clearAll)
afterAll(clearAll)

describe('module registry', () => {
  it('lists the same slugs as slugs.ts', () => {
    expect(MODULES.map((hubModule) => hubModule.slug)).toEqual([...MODULE_SLUGS])
  })
})

describe('To-do', () => {
  it('adds a task', async () => {
    expect(await redirectOf(addTask(form({ title: '  Buy milk  ' })))).toBe('/todo')
    const { tasks } = await new TodoModule().load({})
    expect(tasks.map((task) => task.title)).toEqual(['Buy milk'])
  })

  it('rejects an empty title', async () => {
    expect(await redirectOf(addTask(form({ title: '   ' })))).toBe('/todo?error=empty')
    const data = await new TodoModule().load({ error: 'empty' })
    expect(data.tasks).toHaveLength(0)
    expect(data.error).toBe('Enter a task title.')
  })

  it('toggles and deletes a task, listing done tasks last', async () => {
    const walk = await payload.create({ collection: 'tasks', data: { title: 'Walk' } })
    await payload.create({ collection: 'tasks', data: { title: 'Read' } })

    await redirectOf(toggleTask(form({ task: walk.id })))
    const { tasks } = await new TodoModule().load({})
    expect(tasks.map((task) => [task.title, task.done])).toEqual([
      ['Read', false],
      ['Walk', true],
    ])

    await redirectOf(deleteTask(form({ task: walk.id })))
    expect((await new TodoModule().load({})).tasks).toHaveLength(1)
  })
})

describe('Notes', () => {
  it('creates, edits, and deletes a note', async () => {
    const created = await redirectOf(saveNote(form({ title: 'Idea', body: 'Text' })))
    const id = Number(created.split('note=')[1])
    expect(created).toBe(`/notes?note=${id}`)

    await redirectOf(saveNote(form({ note: id, title: 'Better idea', body: '' })))
    const data = await new NotesModule().load({ note: String(id) })
    expect(data.note?.title).toBe('Better idea')
    expect(data.notes).toHaveLength(1)

    expect(await redirectOf(deleteNote(form({ note: id })))).toBe('/notes')
    expect((await new NotesModule().load({})).notes).toHaveLength(0)
  })

  it('keeps the open note when the title is empty', async () => {
    expect(await redirectOf(saveNote(form({ note: 7, title: '' })))).toBe('/notes?error=empty&note=7')
  })
})

describe('CMS pages', () => {
  it('shows published pages to visitors and hides drafts', async () => {
    await payload.create({
      collection: 'pages',
      data: { title: 'About', slug: 'about', showInMenu: true, _status: 'published' },
    })
    await payload.create({
      collection: 'pages',
      data: { title: 'Secret', slug: 'secret', showInMenu: true, _status: 'draft' },
      draft: true,
    })

    expect((await getPublishedPage('about'))?.title).toBe('About')
    expect(await getPublishedPage('secret')).toBeNull()
    expect((await getMenuPages()).map((page) => page.slug)).toEqual(['about'])
  })

  it('rejects slugs used by modules', async () => {
    await expect(
      payload.create({ collection: 'pages', data: { title: 'Clash', slug: 'weather', _status: 'published' } }),
    ).rejects.toThrow()
  })
})
