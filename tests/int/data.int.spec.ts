import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getMenuPages, getPublishedPage } from '@/lib/pages'
import { getPayloadClient } from '@/lib/payload'
import { MODULES } from '@/modules'
import { MODULE_SLUGS } from '@/modules/slugs'
import { NotesModule } from '@/modules/notes/NotesModule'
import { TodoModule } from '@/modules/todo/TodoModule'

// These tests use a real Postgres database. Run them against a test database,
// never the live one: they delete every task, note, and page.

let payload: Payload

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
  it('lists tasks with done ones last', async () => {
    await payload.create({ collection: 'tasks', data: { title: 'Walk', done: true } })
    await payload.create({ collection: 'tasks', data: { title: 'Read' } })
    const { tasks } = await new TodoModule().load()
    expect(tasks.map((task) => [task.title, task.done])).toEqual([
      ['Read', false],
      ['Walk', true],
    ])
  })
})

describe('Notes', () => {
  it('opens the chosen note', async () => {
    const saved = await payload.create({ collection: 'notes', data: { title: 'Idea', body: 'Text' } })
    const data = await new NotesModule().load({ note: String(saved.id) })
    expect(data.note?.title).toBe('Idea')
    expect(data.notes).toHaveLength(1)
  })
})

describe('CMS pages', () => {
  it('shows published pages to visitors and hides drafts', async () => {
    await payload.create({
      collection: 'pages',
      data: { title: 'Team', slug: 'team', showInMenu: true, _status: 'published' },
    })
    await payload.create({
      collection: 'pages',
      data: { title: 'Secret', slug: 'secret', showInMenu: true, _status: 'draft' },
      draft: true,
    })

    expect((await getPublishedPage('team'))?.title).toBe('Team')
    expect(await getPublishedPage('secret')).toBeNull()
    expect((await getMenuPages()).map((page) => page.slug)).toEqual(['team'])
  })

  it('rejects slugs used by modules', async () => {
    await expect(
      payload.create({ collection: 'pages', data: { title: 'Clash', slug: 'weather', _status: 'published' } }),
    ).rejects.toThrow()
  })
})
