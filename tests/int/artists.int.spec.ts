import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { POST as prefetch } from '@/app/(frontend)/artists/prefetch/route'
import { ArtistLibrary } from '@/lib/musicbrainz/library'
import { getPayloadClient } from '@/lib/payload'

import { FakeMusicBrainz, PEARL_JAM_ID } from '../fixtures/musicbrainz'

// Uses the test database: every artist and artist name is deleted between tests.

let payload: Payload
let fake: FakeMusicBrainz
let library: ArtistLibrary

beforeAll(async () => {
  payload = await getPayloadClient()
})

beforeEach(async () => {
  await payload.delete({ collection: 'artist-names', where: { id: { exists: true } } })
  await payload.delete({ collection: 'artists', where: { id: { exists: true } } })
  fake = new FakeMusicBrainz()
  library = new ArtistLibrary(payload, fake)
})

const kinds = () => fake.calls.map(([kind]) => kind)

describe('ArtistLibrary', () => {
  it('fetches and saves everything the first time', async () => {
    const artist = await library.find('Pearl Jam')
    expect(artist?.name).toBe('Pearl Jam')
    expect(kinds()).toEqual(['search', 'artist', 'releaseGroups'])

    const saved = await library.saved(PEARL_JAM_ID)
    expect((saved?.data as { rating: { value: number } }).rating.value).toBe(4.6)
    expect(saved?.releaseGroups).toHaveLength(4)
  })

  it('uses the database the second time', async () => {
    await library.find('Pearl Jam')
    const calls = fake.calls.length
    expect((await library.find('  pearl jam '))?.name).toBe('Pearl Jam')
    expect(fake.calls).toHaveLength(calls)
  })

  it('falls back to the first artist of a combined name', async () => {
    expect((await library.find('Tame Impala [+] Jennie'))?.name).toBe('Tame Impala')
    expect(fake.calls.slice(0, 2)).toEqual([['search', 'Tame Impala [+] Jennie'], ['search', 'Tame Impala']])
  })

  it('does not accept a close but different name, and remembers that', async () => {
    expect(await library.find('Unknown Band')).toBeNull()
    const calls = fake.calls.length
    expect(await library.find('Unknown Band')).toBeNull()
    expect(fake.calls).toHaveLength(calls)
  })

  it('refreshes data older than 30 days', async () => {
    const artist = await library.find('Pearl Jam')
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    await payload.update({ collection: 'artists', id: artist!.id, data: { fetchedAt: old } })
    await library.find('Pearl Jam')
    expect(kinds().filter((kind) => kind === 'artist')).toHaveLength(2)
  })
})

describe('/artists/prefetch', () => {
  it('refuses requests without the listener secret', async () => {
    const response = await prefetch(new Request('http://localhost/artists/prefetch', {
      method: 'POST',
      body: JSON.stringify({ names: ['Pearl Jam'] }),
    }))
    expect(response.status).toBe(403)
  })

  it('rejects a malformed body', async () => {
    const response = await prefetch(new Request('http://localhost/artists/prefetch', {
      method: 'POST',
      headers: { 'x-listener-secret': process.env.PAYLOAD_SECRET! },
      body: JSON.stringify({ names: 'Pearl Jam' }),
    }))
    expect(response.status).toBe(400)
  })
})
