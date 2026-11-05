import { shortDate } from './dates'
import type { ConcertsData } from './ConcertsModule'

export function ConcertsCard({ data }: { data: ConcertsData }) {
  if ('error' in data) return <p>{data.error}</p>
  if (!data.concerts.length) return <p>No shows listed right now.</p>
  return (
    <ul className="card-mini-list">
      {data.concerts.slice(0, 4).map((show) => (
        <li key={`${show.url}-${show.date}`}>
          <span className="number">{shortDate(show.date)}</span>
          <a href={show.url} rel="noopener" target="_blank">
            {show.name}
            <span className="meta"> · {show.city}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
