import type { Payload } from 'payload'

import type { Song } from '@/payload-types'

import { nameKey, songKey } from '../musicbrainz/names'
import { MusicClient } from './client'

const DAY = 24 * 60 * 60 * 1000
const REFRESH_AFTER = 30 * DAY // songs with a preview
const RETRY_MISSING_AFTER = 7 * DAY // songs without one

type Client = Pick<MusicClient, 'appleSong' | 'deezerSong'>

export const hasPreview = (song: Pick<Song, 'applePreviewUrl' | 'deezerTrackId'>) => Boolean(song.applePreviewUrl || song.deezerTrackId)

/** Finds a song's previews once and saves them. Apple comes first, then Deezer. */
export class SongLibrary {
  constructor(
    private payload: Payload,
    private client: Client = new MusicClient(),
  ) {}

  private async saved(key: string): Promise<Song | null> {
    const { docs } = await this.payload.find({ collection: 'songs', where: { key: { equals: key } }, limit: 1, depth: 0 })
    return docs[0] ?? null
  }

  private static stale(song: Song): boolean {
    const wait = hasPreview(song) ? REFRESH_AFTER : RETRY_MISSING_AFTER
    return !song.checkedAt || Date.now() - new Date(song.checkedAt).getTime() >= wait
  }

  /** True when this song still has to be looked up. */
  async needsLookup(artist: string, title: string): Promise<boolean> {
    const song = await this.saved(songKey(artist, title))
    return !song || SongLibrary.stale(song)
  }

  async find(artist: string, title: string): Promise<Song> {
    const key = songKey(artist, title)
    const song = await this.saved(key)
    if (song && !SongLibrary.stale(song)) return song

    const apple = await this.client.appleSong(artist, title)
    const deezer = apple?.previewUrl ? null : await this.client.deezerSong(artist, title)
    const { docs } = await this.payload.find({ collection: 'artist-names', where: { key: { equals: nameKey(artist) } }, limit: 1, depth: 0 })
    const data = {
      key,
      title: title.trim(),
      artistName: artist.trim(),
      artist: (docs[0]?.artist as number | null | undefined) ?? song?.artist ?? null,
      album: apple?.collectionName ?? deezer?.album?.title ?? '',
      artworkUrl: apple?.artworkUrl100?.replace('100x100bb', '250x250bb') ?? deezer?.album?.cover_medium ?? '',
      applePreviewUrl: apple?.previewUrl ?? '',
      appleUrl: apple?.trackViewUrl ?? '',
      deezerTrackId: deezer?.id ?? null,
      deezerUrl: deezer?.link ?? '',
      checkedAt: new Date().toISOString(),
    }
    return song
      ? this.payload.update({ collection: 'songs', id: song.id, data, depth: 0 })
      : this.payload.create({ collection: 'songs', data, depth: 0 })
  }
}
