const EVENTS_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'

export type Concert = { name: string; url: string; date: string; time: string; venue: string; city: string; image: string }

type RawEvent = {
  name?: string
  url?: string
  dates?: { start?: { localDate?: string; localTime?: string } }
  images?: { url: string; width?: number }[]
  _embedded?: { venues?: { name?: string }[] }
}

/** The parts of a Ticketmaster event the page shows. */
export function concert(event: RawEvent, city: string): Concert {
  const images = [...(event.images ?? [])].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  const image = images.find((item) => (item.width ?? 0) >= 300) ?? images[images.length - 1]
  return {
    name: event.name ?? '',
    url: event.url ?? '',
    date: event.dates?.start?.localDate ?? '',
    time: event.dates?.start?.localTime ?? '',
    venue: event._embedded?.venues?.[0]?.name ?? '',
    city,
    image: image?.url ?? '',
  }
}

/** Talks to Ticketmaster's Discovery API. Needs a free key in TICKETMASTER_API_KEY. */
export class TicketmasterClient {
  timeout = 8000

  async events(city: string, state: string, size = 30): Promise<Concert[]> {
    const query = new URLSearchParams({
      apikey: process.env.TICKETMASTER_API_KEY ?? '',
      classificationName: 'music',
      city,
      stateCode: state,
      sort: 'date,asc',
      size: String(size),
    })
    const response = await fetch(`${EVENTS_URL}?${query}`, { cache: 'no-store', signal: AbortSignal.timeout(this.timeout) })
    if (!response.ok) throw new Error(`Ticketmaster returned ${response.status}`)
    const data = (await response.json()) as { _embedded?: { events?: RawEvent[] } }
    return (data._embedded?.events ?? []).map((event) => concert(event, city))
  }
}
