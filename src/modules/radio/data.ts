// Station data shared by the Radio module, its homepage card, and the listener.
// No React here, so the listener script can import it on its own.

import { IHeartStation, type Station, type Track, TritonStation } from './stations'

export type StationData = { name: string; frequency: string; tracks?: Track[]; error?: string }

export type RadioData = { stations: StationData[] }

/** Postgres NOTIFY channel the listener announces changes on. */
export const RADIO_CHANNEL = 'radio_updates'

const UNAVAILABLE = 'Song information is not available right now.'

export const defaultStations = (): Station[] => [
  new IHeartStation('WEBN', '102.7 FM', 1701),
  new TritonStation('WKRQ', 'Q102 · 101.9 FM', 'WKRQFM'),
]

/** Recent songs for each station. A station that fails reports an error instead. */
export async function stationData(stations: Station[], limit: number): Promise<RadioData> {
  return {
    stations: await Promise.all(
      stations.map(async (station) => {
        const { name, frequency } = station
        try {
          return { name, frequency, tracks: await station.recent(limit) }
        } catch {
          return { name, frequency, error: UNAVAILABLE }
        }
      }),
    ),
  }
}

/** What a viewer can see change: each station's song and whether it is still playing. */
export function signature(data: RadioData): string {
  return JSON.stringify(
    data.stations.map(({ name, tracks }) => {
      const track = tracks?.[0]
      return [name, track ? [track.title, track.artist, track.playing] : null]
    }),
  )
}

/**
 * Checks the stations and announces the card data when a song changes.
 * The station feeds cannot be subscribed to, so the listener asks on a timer.
 */
export class RadioListener {
  lastSeen: string | null = null

  constructor(
    private announce: (data: RadioData) => Promise<void>,
    private stations: Station[] = defaultStations(),
  ) {}

  /** Announce if anything changed since the last check. Returns true when it announced. */
  async check(): Promise<boolean> {
    const data = await stationData(this.stations, 1)
    const seen = signature(data)
    if (seen === this.lastSeen) return false
    await this.announce(data)
    // Remember only after a successful send, so a failed announcement is retried.
    this.lastSeen = seen
    return true
  }
}
