import type { CollectionConfig } from 'payload'

/** A name as the radio spells it, and the artist it matched (or none). */
export const ArtistNames: CollectionConfig = {
  slug: 'artist-names',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'artist', 'checkedAt'],
    description: 'Radio names already looked up, including names with no match.',
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true, admin: { description: 'The name in lowercase.' } },
    { name: 'name', type: 'text', required: true },
    { name: 'artist', type: 'relationship', relationTo: 'artists', admin: { description: 'Empty when nothing matched.' } },
    { name: 'checkedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
