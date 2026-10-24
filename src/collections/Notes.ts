import type { CollectionConfig } from 'payload'

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  defaultSort: '-updatedAt',
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    { name: 'body', type: 'textarea' },
  ],
}
