import Link from 'next/link'

import { HideOnError } from '@/components/HideOnError'
import { LiveButton } from '@/components/LiveButton'
import { SongPlayer } from '@/components/SongPlayer'

import { Airwaves } from './Airwaves'
import { artistUrl, type RadioData } from './data'
import { dialPosition } from './stations'

const DIAL_MARKS = [88, 92, 96, 100, 104, 108]

const playedAt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeStyle: 'short' })

export function RadioView({ data }: { data: RadioData }) {
  return (
    <div className="theme-radio">
      <Airwaves />
      <p className="kicker">Now spinning in Cincinnati</p>
      <h1>Radio</h1>

      <div className="stations">
        {data.stations.map((station) => (
          <section className="panel station" key={station.name}>
            <header className="station-head">
              <h2>{station.name}</h2>
              <span className="station-tune">
                <span className="meta">{station.frequency}</span>
                <LiveButton name={station.name} streamUrl={station.streamUrl} />
              </span>
            </header>
            <div className="tuner" aria-hidden="true">
              <div className="tuner-band">
                {DIAL_MARKS.map((mhz) => (
                  <span key={mhz}>{mhz}</span>
                ))}
                <span className="tuner-needle" style={{ left: `${dialPosition(station.frequency)}%` }} />
              </div>
            </div>
            {station.error ? (
              <p className="notice">{station.error}</p>
            ) : (
              <ol className="tracks">
                {station.tracks?.length ? (
                  station.tracks.map((track) => {
                    const art = track.image || track.song?.artworkUrl
                    return (
                      <li className={`track${track.playing ? ' is-playing' : ''}`} key={track.start}>
                        <span className="art">{art && <HideOnError src={art} alt="" width={112} height={112} loading="lazy" />}</span>
                        <div className="track-text">
                          <span className={`on-air${track.playing ? ' is-live' : ''}`}>
                            {track.playing ? 'On air' : playedAt.format(new Date(track.start * 1000))}
                          </span>
                          <strong>{track.title}</strong>
                          <Link className="artist-link" href={artistUrl(track.artist)} prefetch={false}>
                            {track.artist}
                          </Link>
                        </div>
                        {track.song && <SongPlayer song={track.song} />}
                      </li>
                    )
                  })
                ) : (
                  <li className="track lead">No songs yet.</li>
                )}
              </ol>
            )}
          </section>
        ))}
      </div>

      <p className="source">
        Data: iHeartRadio (WEBN) and Triton Digital (WKRQ). Times are Cincinnati time. Previews from Apple Music and Deezer. Live
        audio comes straight from each station and includes its ads.
      </p>
    </div>
  )
}
