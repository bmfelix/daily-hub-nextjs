import Link from 'next/link'

import { HideOnError } from '@/components/HideOnError'

import { type ListeningData, RANGES } from './ListeningModule'

export function ListeningView({ data }: { data: ListeningData }) {
  return (
    <>
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
    </>
  )
}
