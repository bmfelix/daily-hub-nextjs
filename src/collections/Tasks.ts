import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'done', 'createdAt'],
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    { name: 'done', type: 'checkbox', defaultValue: false },
  ],
}
