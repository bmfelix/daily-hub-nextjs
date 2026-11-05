import { getPayloadClient } from '@/lib/payload'
import type { Task } from '@/payload-types'

import { HubModule } from '../HubModule'
import { TodoCard } from './TodoCard'
import { TodoView } from './TodoView'

export type TodoData = { tasks: Task[] }
export type TodoCardData = { open: Task[]; count: number }

/** Shows tasks. They are read-only here: the data comes from elsewhere. */
export class TodoModule extends HubModule<TodoData, TodoCardData> {
  readonly slug = 'todo'
  readonly title = 'To-do'
  readonly summary = 'A simple task list.'
  readonly View = TodoView
  readonly Card = TodoCard

  async card(): Promise<TodoCardData> {
    const payload = await getPayloadClient()
    const { docs, totalDocs } = await payload.find({ collection: 'tasks', where: { done: { not_equals: true } }, sort: '-createdAt', limit: 4 })
    return { open: docs, count: totalDocs }
  }

  async load(): Promise<TodoData> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({ collection: 'tasks', sort: ['done', '-createdAt'], pagination: false })
    return { tasks: docs }
  }
}
