import type { ChartsCardData } from './ChartsModule'

export function ChartsCard({ data }: { data: ChartsCardData }) {
  if (!data.songs.length) return <p>The most-played songs and artists on Cincinnati radio, week by week.</p>
  return (
    <ol className="card-mini-list">
      {data.songs.map((row, i) => (
        <li key={`${row.artist}-${row.title}`}>
          <span className="number">{String(i + 1).padStart(2, '0')}</span>
          <span>
            {row.title}
            <span className="meta">
              {' '}
              · {row.artist} · {row.plays} play{row.plays === 1 ? '' : 's'}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
