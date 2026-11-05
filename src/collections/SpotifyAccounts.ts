import type { CollectionConfig } from 'payload'

/** The site owner's Spotify login. Hidden: only server code reads the tokens. */
export const SpotifyAccounts: CollectionConfig = {
  slug: 'spotify-accounts',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'accessToken', type: 'text', required: true },
    { name: 'refreshToken', type: 'text', required: true },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}
