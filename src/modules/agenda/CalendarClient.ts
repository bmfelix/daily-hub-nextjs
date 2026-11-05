import IcalExpander from 'ical-expander'

export const TIME_ZONE = 'America/New_York'

export type AgendaItem = { title: string; location: string; allDay: boolean; day: string; time: string }

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeStyle: 'short' })

type Time = { isDate: boolean; toJSDate(): Date }

function agendaItem(event: { summary?: string; location?: string }, start: Time): AgendaItem {
  const date = start.toJSDate()
  return {
    title: event.summary || 'Untitled',
    location: event.location ?? '',
    allDay: start.isDate,
    // An all-day date has no time zone, so it must not shift a day.
    day: start.isDate ? date.toISOString().slice(0, 10) : dayFormat.format(date),
    time: start.isDate ? '' : timeFormat.format(date),
  }
}

/** Expands a calendar file, including repeating events, between two moments. */
export function parseCalendar(ics: string, after: Date, before: Date): AgendaItem[] {
  const { events, occurrences } = new IcalExpander({ ics, maxIterations: 2000 }).between(after, before)
  return [
    ...events.map((event) => agendaItem(event, event.startDate)),
    ...occurrences.map(({ item, startDate }) => agendaItem(item, startDate)),
  ]
}

/** Reads calendars from their iCal addresses, which Apple and Google both offer. */
export class CalendarClient {
  timeout = 10_000

  async events(url: string, after: Date, before: Date): Promise<AgendaItem[]> {
    const response = await fetch(url.trim().replace('webcal://', 'https://'), {
      cache: 'no-store',
      signal: AbortSignal.timeout(this.timeout),
    })
    if (!response.ok) throw new Error(`Calendar returned ${response.status}`)
    return parseCalendar(await response.text(), after, before)
  }
}
