import { afterEach, describe, expect, it, vi } from 'vitest'

import { MusicBrainzClient, USER_AGENT } from '@/lib/musicbrainz/client'
import { nameCandidates, normalize } from '@/lib/musicbrainz/names'
import { artistProfile } from '@/lib/musicbrainz/profile'
import type { Artist } from '@/payload-types'

import { PEARL_JAM, PEARL_JAM_ID, RELEASE_GROUPS, VEDDER_ID } from '../fixtures/musicbrainz'

afterEach(() => vi.unstubAllGlobals())

describe('names', () => {
  it('compares loosely', () => {
    expect(normalize('Lø Spirit!')).toBe('l spirit')
    expect(normalize('  PEARL   jam ')).toBe('pearl jam')
  })

  it('tries the full name, then the first listed artist', () => {
    expect(nameCandidates('Tame Impala [+] Jennie')).toEqual(['Tame Impala [+] Jennie', 'Tame Impala'])
    expect(nameCandidates('Ninth Key, Ekoh & Lø Spirit')).toEqual(['Ninth Key, Ekoh & Lø Spirit', 'Ninth Key'])
    expect(nameCandidates('Simon & Garfunkel')).toEqual(['Simon & Garfunkel', 'Simon'])
    expect(nameCandidates('Pearl Jam')).toEqual(['Pearl Jam'])
  })
})

const saved = (data: object, releaseGroups: object[] = RELEASE_GROUPS) =>
  ({ id: 1, mbid: PEARL_JAM_ID, name: 'Pearl Jam', data, releaseGroups, fetchedAt: '2026-10-24T00:00:00Z' }) as unknown as Artist

describe('artistProfile', () => {
  const profile = artistProfile(saved(PEARL_JAM))

  it('shows the facts', () => {
    expect([profile.type, profile.origin, profile.active]).toEqual(['Group', 'Seattle, United States', '1990–present'])
    expect(profile.genres).toEqual(['grunge', 'rock']) // most votes first
    expect(profile.tags).toEqual(['seattle']) // genres are not repeated as tags
    expect(profile.image).toBe('https://commons.wikimedia.org/wiki/Special:FilePath/PJ.jpg?width=640')
  })

  it('lists current members first, with roles', () => {
    expect(profile.members.map((m) => m.name)).toEqual(['Eddie Vedder', 'Dave Krusen'])
    expect(profile.members[0]).toMatchObject({ roles: ['lead vocals'], original: true })
    expect(profile.members[1].years).toBe('1990–1991')
  })

  it('shows a member listed once per role only once', () => {
    const relations = [...PEARL_JAM.relations, {
      'target-type': 'artist', type: 'member of band', direction: 'backward', begin: '1990', ended: false,
      attributes: ['guitar'], artist: { id: VEDDER_ID, name: 'Eddie Vedder' },
    }]
    const members = artistProfile(saved({ ...PEARL_JAM, relations })).members
    expect(members.map((m) => m.name)).toEqual(['Eddie Vedder', 'Dave Krusen'])
    expect(members[0].roles).toEqual(['lead vocals', 'guitar'])
  })

  it('sorts the discography into sections', () => {
    const sections = Object.fromEntries(profile.discography.map((s) => [s.label, s.releases.map((r) => r.title)]))
    expect(sections).toEqual({ Albums: ['Ten', 'Vs.'], Singles: ['Alive'], Live: ['Live on Two Legs'] })
  })

  it('groups and names links', () => {
    const links = Object.fromEntries(profile.links.map((g) => [g.label, g.items.map((i) => i.label)]))
    expect(links).toEqual({ Listen: ['Spotify'], Official: ['pearljam.com'] })
    expect(profile.officialUrl).toBe('https://pearljam.com/')
  })
})

describe('MusicBrainzClient', () => {
  it('identifies itself and retries once when told to slow down', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ artists: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const client = Object.assign(new MusicBrainzClient(), { minInterval: 0, retryDelay: 0 })

    expect(await client.searchArtists('Pearl Jam')).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1].headers['User-Agent']).toBe(USER_AGENT)
  })

  it('waits between requests', async () => {
    const times: number[] = []
    vi.stubGlobal('fetch', vi.fn(async () => {
      times.push(Date.now())
      return Response.json({ artists: [] })
    }))
    const client = Object.assign(new MusicBrainzClient(), { minInterval: 200 })

    await Promise.all([client.searchArtists('A'), client.searchArtists('B')])
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(190)
  })
})
