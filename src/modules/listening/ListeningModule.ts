import { getPayloadClient } from '@/lib/payload'
import { type TopItems, topItems } from '@/lib/spotify'

import { HubModule, param, type SearchParams } from '../HubModule'
import { ListeningView } from './ListeningView'

export const RANGES: Record<string, string> = {
  short_term: 'Last 4 weeks',
  medium_term: 'Last 6 months',
  long_term: 'All time',
}

export type ListeningData = { chosen: string } & ({ error: string } | TopItems)

export class ListeningModule extends HubModule<ListeningData> {
  readonly slug = 'listening'
  readonly title = 'Listening'
  readonly summary = 'Top artists and tracks from Spotify.'
  readonly View = ListeningView
  readonly onHome = false

  async load(params: SearchParams): Promise<ListeningData> {
    const range = param(params, 'range')
    const chosen = range in RANGES ? range : 'short_term'
    try {
      const stats = await topItems(await getPayloadClient(), chosen)
      return stats ? { chosen, ...stats } : { chosen, error: 'Spotify is not connected yet.' }
    } catch {
      return { chosen, error: 'Spotify did not respond. Try again shortly.' }
    }
  }
}
