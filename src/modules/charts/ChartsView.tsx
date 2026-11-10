import Link from 'next/link'

import { PlayButton } from '@/components/PlayButton'
import { hasPreview } from '@/lib/music/library'

import { shortDate } from '../concerts/dates'
import { Airwaves } from '../radio/Airwaves'
import { artistUrl } from '../radio/data'
import type { ChartsData } from './ChartsModule'

export function ChartsView({ data }: { data: ChartsData }) {
  return (
    <div className="theme-radio">
      <Airwaves />
      <p className="kicker">The weekly countdown</p>
      <h1>Charts</h1>

      <nav className="week-nav" aria-label="Week">
        {data.previousWeek && (
          <Link className="pill" href={`/charts?week=${data.previousWeek}`}>
            ← Earlier
          </Link>
        )}
        <strong>
          {shortDate(data.monday)} – {shortDate(data.sunday)}
        </strong>
        {data.nextWeek && (
          <Link className="pill" href={`/charts?week=${data.nextWeek}`}>
            Later →
          </Link>
        )}
        <span className="meta">
          {data.total} play{data.total === 1 ? '' : 's'} counted
        </span>
      </nav>

      {data.stations.length ? (
        data.stations.map((station) => (
          <section className="chart-station" key={station.name}>
            <h2>{station.name}</h2>
            <div className="chart-columns">
              <div>
                <h3>Top songs</h3>
                <ol className="chart">
                  {station.songs.map((row, i) => (
                    <li key={`${row.artist}-${row.title}`}>
                      <span className="chart-rank">{i + 1}</span>
                      <span className="chart-row">
                        <strong>{row.title}</strong>
                        <Link className="artist-link" href={artistUrl(row.artist)} prefetch={false}>
                          {row.artist}
                        </Link>
                        <span className="chart-bar" aria-hidden="true">
                          <span style={{ width: `${row.bar}%` }} />
                        </span>
                      </span>
                      <span className="meta">{row.plays}</span>
                      {row.song && hasPreview(row.song) && <PlayButton song={row.song} />}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3>Top artists</h3>
                <ol className="chart">
                  {station.artists.map((row, i) => (
                    <li key={row.artist}>
                      <span className="chart-rank">{i + 1}</span>
                      <span className="chart-row">
                        <Link className="artist-link" href={artistUrl(row.artist)} prefetch={false}>
                          <strong>{row.artist}</strong>
                        </Link>
                        <span className="chart-bar" aria-hidden="true">
                          <span style={{ width: `${row.bar}%` }} />
                        </span>
                      </span>
                      <span className="meta">{row.plays}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ))
      ) : (
        <p className="notice">No plays saved for this week yet. Songs are counted as the listener hears them.</p>
      )}

      <p className="source">Counted by Daily Hub from each station&apos;s song feed, from the day tracking began.</p>
    </div>
  )
}
