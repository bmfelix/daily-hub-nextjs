import type { Payload } from 'payload'

import type { Artist } from '@/payload-types'

import { MusicClient } from '../music/client'
import { WikipediaClient } from '../wikipedia'
import { MusicBrainzClient } from './client'
import { nameCandidates, nameKey, normalize } from './names'

const DAY = 24 * 60 * 60 * 1000
const REFRESH_AFTER = 30 * DAY // saved artist details
const RETRY_UNMATCHED_AFTER = 7 * DAY // names that matched no artist

type Client = Pick<MusicBrainzClient, 'searchArtists' | 'artist' | 'releaseGroups'>
type Wikipedia = Pick<WikipediaClient, 'find'>
type Music = Pick<MusicClient, 'appleAlbums'>

const age = (date: string) => Date.now() - new Date(date).getTime()

/** Finds artists by the name the radio uses. Checks the database before MusicBrainz. */
export class ArtistLibrary {
  constructor(
    private payload: Payload,
    private client: Client = new MusicBrainzClient(),
    private wikipedia: Wikipedia = new WikipediaClient(),
    private music: Music = new MusicClient(),
  ) {}

  /** The saved artist for this name, fetching it the first time. Null if nothing matches. */
  async find(name: string): Promise<Artist | null> {
    const key = nameKey(name)
    const { docs } = await this.payload.find({ collection: 'artist-names', where: { key: { equals: key } }, limit: 1, depth: 1 })
    const entry = docs[0]
    const linked = entry?.artist as Artist | null | undefined
    if (linked) return this.save(linked.mbid)
    if (entry && age(entry.checkedAt) < RETRY_UNMATCHED_AFTER) return null

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
    if (existing && age(existing.fetchedAt) < REFRESH_AFTER) {
      return existing.extrasCheckedAt ? existing : this.addExtras(existing)
    }

    const record = await this.client.artist(mbid)
    const releaseGroups = await this.client.releaseGroups(mbid)
    const data = {
      mbid,
      name: record.name,
      data: record,
      releaseGroups,
      fetchedAt: new Date().toISOString(),
      ...(await this.extras(record)),
    }
    return existing
      ? this.payload.update({ collection: 'artists', id: existing.id, data })
      : this.payload.create({ collection: 'artists', data })
  }

  /** Wikipedia text and Apple artwork. If either service fails, they are tried again later. */
  private async extras(record: Parameters<Wikipedia['find']>[0]) {
    try {
      const page = await this.wikipedia.find(record)
      return {
        wikipediaTitle: page?.title ?? '',
        wikipediaUrl: page?.url ?? '',
        wikipediaSummary: page?.summary ?? '',
        wikipediaImage: page?.image ?? '',
        appleAlbums: await this.music.appleAlbums(record.name),
        extrasCheckedAt: new Date().toISOString(),
      }
    } catch {
      return {}
    }
  }

  /** Fill in the extras for an artist saved before they existed. */
  async addExtras(artist: Artist): Promise<Artist> {
    const data = await this.extras(artist.data as unknown as Parameters<Wikipedia['find']>[0])
    return this.payload.update({ collection: 'artists', id: artist.id, data })
  }

  /** Fill in a few saved artists. Returns how many are still waiting afterwards. */
  async fillMissing(limit: number): Promise<number> {
    const { docs, totalDocs } = await this.payload.find({ collection: 'artists', where: { extrasCheckedAt: { exists: false } }, limit })
    for (const artist of docs) await this.addExtras(artist)
    return Math.max(0, totalDocs - docs.length)
  }
}
