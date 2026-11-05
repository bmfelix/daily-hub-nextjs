import Link from 'next/link'

import { HideOnError } from '@/components/HideOnError'

import { dayOf, monthOf } from './dates'
import type { ConcertsData } from './ConcertsModule'

export function ConcertsView({ data }: { data: ConcertsData }) {
  return (
    <>
      <p className="kicker">Live and loud</p>
      <h1>Concerts</h1>

      <nav className="filter-pills" aria-label="City">
        <Link className={`pill${data.chosen ? '' : ' is-chosen'}`} href="/concerts">
          All cities
        </Link>
        {data.cities.map((city) => (
          <Link className={`pill${data.chosen === city ? ' is-chosen' : ''}`} href={`/concerts?city=${city}`} key={city}>
            {city}
          </Link>
        ))}
      </nav>

      {'error' in data ? (
        <p className="notice">{data.error}</p>
      ) : data.concerts.length ? (
        <ul className="shows">
          {data.concerts.map((show) => (
            <li className="show" key={`${show.url}-${show.date}`}>
              <a href={show.url} rel="noopener" target="_blank">
                <span className="show-image">
                  {show.image && <HideOnError src={show.image} alt="" loading="lazy" />}
                  <time dateTime={show.date}>
                    <b>{dayOf(show.date)}</b>
                    {monthOf(show.date)}
                  </time>
                </span>
                <strong>{show.name}</strong>
                <span className="meta">
                  {show.venue} · {show.city}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lead">No shows listed right now.</p>
      )}

      <p className="source">Data: Ticketmaster</p>
    </>
  )
}
