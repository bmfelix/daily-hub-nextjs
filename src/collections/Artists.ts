import type { CollectionConfig } from 'payload'

/** Everything MusicBrainz has on one artist, saved so it is fetched only once. */
export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'fetchedAt'],
    description: 'Filled automatically from MusicBrainz when an artist is first looked up.',
  },
  defaultSort: 'name',
  fields: [
    { name: 'mbid', label: 'MusicBrainz ID', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'data', type: 'json', required: true, admin: { description: 'The full MusicBrainz artist record.' } },
    { name: 'releaseGroups', type: 'json', required: true, admin: { description: 'Every album, EP, and single.' } },
    { name: 'fetchedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
