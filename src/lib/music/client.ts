// Song previews and album artwork from Apple and Deezer. Neither needs a key.

import { compact, nameCandidates, normalize } from '../musicbrainz/names'

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search'
const DEEZER_SEARCH_URL = 'https://api.deezer.com/search'
const DEEZER_TRACK_URL = 'https://api.deezer.com/track'

export type AppleSong = {
  artistName?: string
  trackName?: string
  collectionName?: string
  previewUrl?: string
  trackViewUrl?: string
  artworkUrl100?: string
}
export type DeezerSong = {
  id?: number
  title?: string
  link?: string
  artist?: { name?: string }
  album?: { title?: string; cover_medium?: string }
}
export type AppleAlbums = Record<string, { artwork: string; url: string }>

/** True when a service's artist name matches, allowing for "A & B" on either side. */
export function sameArtist(wanted: string, found: string): boolean {
  const name = compact(found)
  if (!name) return false
  return nameCandidates(wanted).map(compact).some((candidate) => candidate && (candidate.includes(name) || name.includes(candidate)))
}

/** The item for this song: an exact title first, then one with extra words like "(Remastered)". */
export function bestMatch<T>(items: T[], artist: string, title: string, read: (item: T) => [string, string]): T | null {
  const wanted = compact(title)
  if (!wanted) return null
  const matches = items
    .filter((item) => sameArtist(artist, read(item)[0]))
    .map((item) => [compact(read(item)[1]), item] as const)
  const exact = matches.find(([found]) => found === wanted)
  if (exact) return exact[1]
  return matches.find(([found]) => found && (found.startsWith(wanted) || wanted.startsWith(found)))?.[1] ?? null
}

/** An album's title without extras, so "Ten (Remastered)" and "Ten - EP" match "Ten". */
export const albumKey = (title: string) => normalize(title.replace(/\s*(?:[([].*|-\s*(?:Single|EP))$/, ''))

export class MusicClient {
  timeout = 8000

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(this.timeout) })
    if (!response.ok) throw new Error(`Music lookup returned ${response.status}`)
    return response.json() as Promise<T>
  }

  async appleSong(artist: string, title: string): Promise<AppleSong | null> {
    const query = new URLSearchParams({ term: `${artist} ${title}`, entity: 'song', limit: '10', country: 'US' })
    const { results = [] } = await this.get<{ results?: AppleSong[] }>(`${ITUNES_SEARCH_URL}?${query}`)
    return bestMatch(results, artist, title, (item) => [item.artistName ?? '', item.trackName ?? ''])
  }

  async deezerSong(artist: string, title: string): Promise<DeezerSong | null> {
    const query = new URLSearchParams({ q: `${artist} ${title}`, limit: '10' })
    const { data = [] } = await this.get<{ data?: DeezerSong[] }>(`${DEEZER_SEARCH_URL}?${query}`)
    return bestMatch(data, artist, title, (item) => [item.artist?.name ?? '', item.title ?? ''])
  }

  /** A preview address. Deezer's expire within minutes, so they are fetched when played, never saved. */
  async deezerPreview(trackId: number): Promise<string> {
    return (await this.get<{ preview?: string }>(`${DEEZER_TRACK_URL}/${trackId}`)).preview ?? ''
  }

  /** Every Apple album by this exact artist, keyed by album title. */
  async appleAlbums(artist: string): Promise<AppleAlbums> {
    const query = new URLSearchParams({ term: artist, entity: 'album', attribute: 'artistTerm', limit: '200', country: 'US' })
    const { results = [] } = await this.get<{
      results?: { artistName?: string; collectionName?: string; artworkUrl100?: string; collectionViewUrl?: string }[]
    }>(`${ITUNES_SEARCH_URL}?${query}`)
    const albums: AppleAlbums = {}
    for (const item of results) {
      if (compact(item.artistName ?? '') !== compact(artist) || !item.artworkUrl100) continue
      albums[albumKey(item.collectionName ?? '')] ??= {
        artwork: item.artworkUrl100.replace('100x100bb', '250x250bb'),
        url: item.collectionViewUrl ?? '',
      }
    }
    return albums
  }
}
