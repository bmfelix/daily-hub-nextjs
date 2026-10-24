const API_URL = 'https://musicbrainz.org/ws/2'
// MusicBrainz asks every app to identify itself with a name and a contact address.
export const USER_AGENT = 'DailyHub/1.0 ( bradfelix1@gmail.com )'
const ARTIST_INCLUDES = 'aliases+genres+tags+ratings+url-rels+artist-rels'

export type SearchResult = { id: string; name: string; score?: number; aliases?: { name: string }[] }
// The artist record is stored as MusicBrainz sends it; profile.ts reads the parts it shows.
export type MusicBrainzArtist = { id: string; name: string; [field: string]: unknown }
export type ReleaseGroup = {
  id: string
  title: string
  'primary-type'?: string | null
  'secondary-types'?: string[]
  'first-release-date'?: string
}

/** The MusicBrainz web service. No key, but at most one request per second. */
export class MusicBrainzClient {
  timeout = 10_000
  minInterval = 1100 // milliseconds between requests, with a little margin
  retryDelay = 3000 // before the one retry

  // One queue per process, shared by every instance, so requests never overlap.
  private static queue: Promise<unknown> = Promise.resolve()
  private static lastRequest = 0

  searchArtists(name: string, limit = 5): Promise<SearchResult[]> {
    return this.get<{ artists: SearchResult[] }>('artist/', { query: `artist:"${name}"`, limit: String(limit) }).then(
      (data) => data.artists,
    )
  }

  artist(mbid: string): Promise<MusicBrainzArtist> {
    return this.get(`artist/${mbid}`, { inc: ARTIST_INCLUDES })
  }

  /** Every album, EP, and single, up to `pages` × 100 (big bands have over 1,000, mostly live). */
  async releaseGroups(mbid: string, pages = 15): Promise<ReleaseGroup[]> {
    const groups: ReleaseGroup[] = []
    for (let page = 0; page < pages; page++) {
      const data = await this.get<{ 'release-groups': ReleaseGroup[]; 'release-group-count': number }>('release-group', {
        artist: mbid,
        limit: '100',
        offset: String(page * 100),
      })
      groups.push(...data['release-groups'])
      if (groups.length >= data['release-group-count']) break
    }
    return groups
  }

  /** One request, retried once if the connection fails or MusicBrainz says to slow down (503). */
  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    for (const attempt of [1, 2]) {
      try {
        const response = await this.send(path, params)
        if (response.status !== 503 || attempt === 2) {
          if (!response.ok) throw new MusicBrainzError(response.status)
          return (await response.json()) as T
        }
      } catch (error) {
        if (error instanceof MusicBrainzError || attempt === 2) throw error
      }
      await sleep(this.retryDelay)
    }
    throw new Error('unreachable')
  }

  private send(path: string, params: Record<string, string>): Promise<Response> {
    const run = async () => {
      const wait = MusicBrainzClient.lastRequest + this.minInterval - Date.now()
      if (wait > 0) await sleep(wait)
      try {
        const query = new URLSearchParams({ ...params, fmt: 'json' })
        return await fetch(`${API_URL}/${path}?${query}`, {
          headers: { 'User-Agent': USER_AGENT },
          cache: 'no-store',
          signal: AbortSignal.timeout(this.timeout),
        })
      } finally {
        MusicBrainzClient.lastRequest = Date.now()
      }
    }
    const result = MusicBrainzClient.queue.then(run, run)
    MusicBrainzClient.queue = result.catch(() => {})
    return result
  }
}

/** MusicBrainz answered with an error status (for example 404 for an unknown ID). */
export class MusicBrainzError extends Error {
  constructor(readonly status: number) {
    super(`MusicBrainz returned ${status}`)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
