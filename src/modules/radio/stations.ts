const IHEART_HISTORY_URL = 'https://us.api.iheart.com/api/v3/live-meta/stream'
const TRITON_NOW_PLAYING_URL = 'https://np.tritondigital.com/public/nowplaying'
const TIMEOUT = 5000

export type Track = {
  title: string
  artist: string
  image: string
  /** Start and end, in seconds since 1970. */
  start: number
  end: number
  playing: boolean
}

async function get(url: string) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT) })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response
}

/** One radio station. Subclasses read song data from their broadcaster's API. */
export abstract class Station {
  constructor(
    readonly name: string,
    readonly frequency: string,
  ) {}

  /** Recent songs, newest first. Each subclass calls its own API here. */
  protected abstract tracks(limit: number): Promise<Omit<Track, 'playing'>[]>

  /** Recent songs, newest first. The newest is marked as playing if it has not ended yet. */
  async recent(limit = 10): Promise<Track[]> {
    const now = Date.now() / 1000
    return (await this.tracks(limit)).map((track, i) => ({ ...track, playing: i === 0 && now < track.end }))
  }
}

type IHeartItem = { title: string; artist: string; startTime: number; endTime: number; imagePath?: string }

/** Reads song history from iHeartRadio's public API (no key). The newest song can appear about a minute late. */
export class IHeartStation extends Station {
  constructor(name: string, frequency: string, private stationId: number) {
    super(name, frequency)
  }

  protected async tracks(limit: number) {
    const response = await get(`${IHEART_HISTORY_URL}/${this.stationId}/trackHistory?limit=${limit}`)
    const { data } = (await response.json()) as { data: IHeartItem[] }
    return data.map((item) => ({
      title: item.title.trim(),
      artist: item.artist.trim(),
      image: (item.imagePath ?? '').replace(/^http:\/\//, 'https://'),
      start: item.startTime,
      end: item.endTime,
    }))
  }
}

/** Reads live song data from Triton Digital's public now-playing feed (no key). */
export class TritonStation extends Station {
  constructor(name: string, frequency: string, private mount: string) {
    super(name, frequency)
  }

  protected async tracks(limit: number) {
    // Ask for extra: the feed repeats a song when it is cued twice.
    const query = new URLSearchParams({ mountName: this.mount, numberToFetch: String(limit * 2), eventType: 'track' })
    const xml = await (await get(`${TRITON_NOW_PLAYING_URL}?${query}`)).text()

    const tracks: Omit<Track, 'playing'>[] = []
    let lastId: string | undefined
    for (const [, body] of xml.matchAll(/<nowplaying-info\b[^>]*>([\s\S]*?)<\/nowplaying-info>/g)) {
      const props = TritonStation.properties(body)
      const start = Number(props.cue_time_start) / 1000
      if (!Number.isFinite(start)) throw new Error('Triton event without a start time')
      const track = {
        // The feed marks some titles with trailing asterisks, as in "Rolling In The Deep**".
        title: (props.cue_title ?? '').trim().replace(/\*+$/, ''),
        artist: (props.track_artist_name ?? '').trim(),
        image: '',
        start,
        end: start + Number(props.cue_time_duration ?? 0) / 1000,
      }
      if (props.track_id === lastId) tracks[tracks.length - 1] = track // an older cue of the same song: keep its earlier start
      else tracks.push(track)
      lastId = props.track_id
    }
    return tracks.slice(0, limit)
  }

  /** Read the <property name="...">value</property> pairs of one event. */
  private static properties(body: string): Record<string, string> {
    const props: Record<string, string> = {}
    for (const [, name, value] of body.matchAll(/<property name="([^"]+)">(?:<!\[CDATA\[([\s\S]*?)\]\]>)?<\/property>/g)) {
      props[name] = value ?? ''
    }
    return props
  }
}
