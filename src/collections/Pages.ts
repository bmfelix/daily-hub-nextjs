import type { CollectionConfig } from 'payload'

import { MODULE_SLUGS } from '@/modules/slugs'

const RESERVED_SLUGS: string[] = ['admin', 'api', ...MODULE_SLUGS]

/** Editable content pages, like WordPress pages. Published pages are public at /<slug>. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'showInMenu', '_status', 'updatedAt'],
  },
  access: {
    // Visitors see published pages only. Logged-in editors also see drafts.
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'The page address, for example "about" for /about.' },
      validate: (value: string | null | undefined) => {
        if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Use lowercase letters, numbers, and single hyphens.'
        }
        if (RESERVED_SLUGS.includes(value)) return `"${value}" is already used by the site.`
        return true
      },
    },
    {
      name: 'showInMenu',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'content', type: 'richText' },
  ],
}
