import { remember } from '@/lib/cache'

import { HubModule } from '../HubModule'
import { AgendaCard } from './AgendaCard'
import { type AgendaItem, CalendarClient } from './CalendarClient'
import { AgendaView } from './AgendaView'

const DAYS_AHEAD = 14
const CACHE_SECONDS = 15 * 60

export type AgendaData =
  | { error: string }
  | { items: AgendaItem[]; days: { date: string; items: AgendaItem[] }[]; failed: number }

export class AgendaModule extends HubModule<AgendaData, AgendaData> {
  readonly slug = 'agenda'
  readonly title = 'Agenda'
  readonly summary = 'What is on the calendar for the next two weeks.'
  readonly View = AgendaView
  readonly Card = AgendaCard

  constructor(
    private client = new CalendarClient(),
    private urls = () => (process.env.CALENDAR_URLS ?? '').split(',').filter((url) => url.trim()),
  ) {
    super()
  }

  /** All events and how many calendars could not be read. One bad calendar does not hide the rest. */
  private async fetch(urls: string[]) {
    const after = new Date()
    after.setHours(0, 0, 0, 0)
    const before = new Date(after.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000)
    const results = await Promise.allSettled(urls.map((url) => this.client.events(url, after, before)))
    const items = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    const failed = results.filter((result) => result.status === 'rejected').length
    const sortKey = (item: AgendaItem) => `${item.day}${item.allDay ? '0' : '1'}${item.time.padStart(8, '0')}`
    items.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    return { items, failed }
  }

  async load(): Promise<AgendaData> {
    const urls = this.urls()
    if (!urls.length) return { error: 'Add your calendar links to see them here.' }

    const { items, failed } = await remember('agenda-events', CACHE_SECONDS, () => this.fetch(urls))
    const days = new Map<string, AgendaItem[]>()
    for (const item of items) days.set(item.day, [...(days.get(item.day) ?? []), item])
    return { items, days: [...days].map(([date, entries]) => ({ date, items: entries })), failed }
  }

  card() {
    return this.load()
  }
}
