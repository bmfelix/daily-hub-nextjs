import { shortDate } from '../concerts/dates'
import type { AgendaData } from './AgendaModule'

export function AgendaCard({ data }: { data: AgendaData }) {
  if ('error' in data) return <p>{data.error}</p>
  if (!data.items.length) return <p>{data.failed ? 'Your calendars could not be read.' : 'Nothing on your calendars for two weeks.'}</p>
  return (
    <ul className="card-mini-list">
      {data.items.slice(0, 4).map((item, i) => (
        <li key={`${item.day}-${item.title}-${i}`}>
          <span className="number">{shortDate(item.day)}</span>
          <span>
            {item.title}
            <span className="meta"> · {item.allDay ? 'All day' : item.time}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
