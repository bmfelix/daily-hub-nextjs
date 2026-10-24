import { getPayloadClient } from '@/lib/payload'
import type { Task } from '@/payload-types'

import { HubModule, param, type SearchParams } from '../HubModule'
import { TodoView } from './TodoView'

export type TodoData = { tasks: Task[]; error?: string }

export class TodoModule extends HubModule<TodoData> {
  readonly slug = 'todo'
  readonly title = 'To-do'
  readonly summary = 'A simple task list saved in the database.'
  readonly View = TodoView

  async load(params: SearchParams): Promise<TodoData> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({ collection: 'tasks', sort: ['done', '-createdAt'], pagination: false })
    return {
      tasks: docs,
      error: param(params, 'error') === 'empty' ? 'Enter a task title.' : undefined,
    }
  }
}
