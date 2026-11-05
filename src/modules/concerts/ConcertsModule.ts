import { remember } from '@/lib/cache'

import { HubModule, param, type SearchParams } from '../HubModule'
import { ConcertsCard } from './ConcertsCard'
import { ConcertsView } from './ConcertsView'
import { type Concert, TicketmasterClient } from './TicketmasterClient'

const CITIES: [string, string][] = [
  ['Cincinnati', 'OH'],
  ['Dayton', 'OH'],
  ['Columbus', 'OH'],
]
const CACHE_SECONDS = 6 * 60 * 60 // listings change slowly, and the free key has a daily limit

type Base = { cities: string[]; chosen: string }
export type ConcertsData = Base & ({ error: string } | { concerts: Concert[] })

export class ConcertsModule extends HubModule<ConcertsData, ConcertsData> {
  readonly slug = 'concerts'
  readonly title = 'Concerts'
  readonly summary = 'Upcoming shows in Cincinnati, Dayton, and Columbus.'
  readonly View = ConcertsView
  readonly Card = ConcertsCard

  constructor(private client = new TicketmasterClient()) {
    super()
  }

  async load(params: SearchParams = {}): Promise<ConcertsData> {
    const cities = CITIES.map(([city]) => city)
    const city = param(params, 'city')
    const chosen = cities.includes(city) ? city : ''
    if (!process.env.TICKETMASTER_API_KEY) {
      return { cities, chosen, error: 'Concert listings need a Ticketmaster API key.' }
    }

    try {
      const results = await Promise.all(
        CITIES.filter(([name]) => !chosen || name === chosen).map(([name, state]) =>
          remember(`concerts-${name}`, CACHE_SECONDS, () => this.client.events(name, state)),
        ),
      )
      const concerts = results
        .flat()
        .filter((show) => show.date)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      return { cities, chosen, concerts }
    } catch {
      return { cities, chosen, error: 'The concert service did not respond. Try again shortly.' }
    }
  }

  card() {
    return this.load()
  }
}
