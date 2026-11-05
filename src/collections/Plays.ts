import type { CollectionConfig } from 'payload'

/** One song heard on one station. The charts are counted from these. */
export const Plays: CollectionConfig = {
  slug: 'plays',
  admin: { useAsTitle: 'title', defaultColumns: ['playedAt', 'station', 'artistName', 'title'] },
  defaultSort: '-playedAt',
  indexes: [{ fields: ['station', 'playedAt'], unique: true }],
  fields: [
    { name: 'station', type: 'text', required: true },
    { name: 'artistName', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'songKey', type: 'text', required: true, index: true },
    { name: 'playedAt', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
