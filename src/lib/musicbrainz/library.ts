import type { Payload } from 'payload'

import type { Artist } from '@/payload-types'

import { MusicBrainzClient } from './client'
import { nameCandidates, nameKey, normalize } from './names'

const DAY = 24 * 60 * 60 * 1000
const REFRESH_AFTER = 30 * DAY // saved artist details
const RETRY_UNMATCHED_AFTER = 7 * DAY // names that matched no artist

type Client = Pick<MusicBrainzClient, 'searchArtists' | 'artist' | 'releaseGroups'>

const age = (date: string) => Date.now() - new Date(date).getTime()

/** Finds artists by the name the radio uses. Checks the database before MusicBrainz. */
export class ArtistLibrary {
  constructor(
    private payload: Payload,
    private client: Client = new MusicBrainzClient(),
  ) {}

  /** The saved artist for this name, fetching it the first time. Null if nothing matches. */
  async find(name: string): Promise<Artist | null> {
    const key = nameKey(name)
    const { docs } = await this.payload.find({ collection: 'artist-names', where: { key: { equals: key } }, limit: 1, depth: 1 })
    const entry = docs[0]
    if (entry) {
      const artist = entry.artist as Artist | null | undefined
      if (artist && age(artist.fetchedAt) < REFRESH_AFTER) return artist
      if (!artist && age(entry.checkedAt) < RETRY_UNMATCHED_AFTER) return null
    }

    const mbid = await this.match(name)
    const artist = mbid ? await this.save(mbid) : null
    const data = { key, name: name.trim(), artist: artist?.id ?? null, checkedAt: new Date().toISOString() }
    if (entry) await this.payload.update({ collection: 'artist-names', id: entry.id, data })
    else await this.payload.create({ collection: 'artist-names', data })
    return artist
  }

  /** The MusicBrainz ID whose name (or alias) really matches, or null. */
  async match(name: string): Promise<string | null> {
    for (const candidate of nameCandidates(name)) {
      const wanted = normalize(candidate)
      for (const result of await this.client.searchArtists(candidate)) {
        if ((result.score ?? 0) < 90) break // results are sorted by score
        const names = [result.name, ...(result.aliases ?? []).map((alias) => alias.name)]
        if (names.some((n) => normalize(n) === wanted)) return result.id
      }
    }
    return null
  }

  /** A saved artist by MusicBrainz ID, or null. */
  async saved(mbid: string): Promise<Artist | null> {
    const { docs } = await this.payload.find({ collection: 'artists', where: { mbid: { equals: mbid } }, limit: 1 })
    return docs[0] ?? null
  }

  /** Fetch and save one artist, unless the saved copy is still fresh. */
  async save(mbid: string): Promise<Artist> {
    const existing = await this.saved(mbid)
    if (existing && age(existing.fetchedAt) < REFRESH_AFTER) return existing

    const record = await this.client.artist(mbid)
    const releaseGroups = await this.client.releaseGroups(mbid)
    const data = { mbid, name: record.name, data: record, releaseGroups, fetchedAt: new Date().toISOString() }
    return existing
      ? this.payload.update({ collection: 'artists', id: existing.id, data })
      : this.payload.create({ collection: 'artists', data })
  }
}
