import type { CollectionConfig } from 'payload'

/** A song heard on the radio, with where to preview it. Each is looked up once. */
export const Songs: CollectionConfig = {
  slug: 'songs',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'artistName', 'album', 'checkedAt'] },
  defaultSort: 'artistName',
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'artistName', type: 'text', required: true },
    { name: 'artist', type: 'relationship', relationTo: 'artists', index: true },
    { name: 'album', type: 'text' },
    { name: 'artworkUrl', type: 'text' },
    { name: 'applePreviewUrl', type: 'text' },
    { name: 'appleUrl', type: 'text' },
    { name: 'deezerTrackId', type: 'number' },
    { name: 'deezerUrl', type: 'text' },
    { name: 'checkedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
