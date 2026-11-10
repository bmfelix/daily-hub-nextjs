import Link from 'next/link'

import { HideOnError } from '@/components/HideOnError'

import './phones.css'

import { type ListeningData, RANGES } from './ListeningModule'

/** Headphones with sound coming out, where other pages have music notes. */
function Headphones() {
  return (
    <div className="phones-art" aria-hidden="true">
      <svg viewBox="0 0 200 170">
        <path className="phones-band" d="M44 104V86a56 56 0 0 1 112 0v18" />
        <rect className="phones-cup" x="28" y="96" width="32" height="56" rx="13" />
        <rect className="phones-cup" x="140" y="96" width="32" height="56" rx="13" />
        <path className="phones-wave" d="M16 108q-9 16 0 32" />
        <path className="phones-wave far" d="M5 98q-16 26 0 52" />
        <path className="phones-wave" d="M184 108q9 16 0 32" />
        <path className="phones-wave far" d="M195 98q16 26 0 52" />
      </svg>
    </div>
  )
}

export function ListeningView({ data }: { data: ListeningData }) {
  return (
    <div className="theme-phones">
      <Headphones />
      <p className="kicker">On heavy rotation</p>
      <h1>Listening</h1>

      <nav className="filter-pills" aria-label="Time period">
        {Object.entries(RANGES).map(([value, label]) => (
          <Link className={`pill${value === data.chosen ? ' is-chosen' : ''}`} href={`/listening?range=${value}`} key={value}>
            {label}
          </Link>
        ))}
      </nav>

      {'error' in data ? (
        <p className="notice">{data.error}</p>
      ) : (
        <>
          <section className="artist-section">
            <h2>Top artists</h2>
            <ol className="top-artists">
              {data.artists.map((artist, i) => (
                <li key={artist.url || artist.name}>
                  <a href={artist.url} rel="noopener" target="_blank">
                    <span className="art">{artist.image && <HideOnError src={artist.image} alt="" loading="lazy" />}</span>
                    <strong>
                      {i + 1}. {artist.name}
                    </strong>
                    {artist.genres.length > 0 && <span className="meta">{artist.genres.join(' · ')}</span>}
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section className="artist-section">
            <h2>Top tracks</h2>
            <ol className="songs">
              {data.tracks.map((track, i) => (
                <li key={track.url || track.title}>
                  <span className="art">{track.artwork && <HideOnError src={track.artwork} alt="" loading="lazy" />}</span>
                  <div className="track-text">
                    <strong>
                      {i + 1}. {track.title}
                    </strong>
                    <a className="artist-link" href={track.url} rel="noopener" target="_blank">
                      {track.artist}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      <p className="source">Data: Spotify</p>
    </div>
  )
}
