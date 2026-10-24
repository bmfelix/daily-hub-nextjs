import Image from 'next/image'

import type { RadioData } from './data'

const playedAt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeStyle: 'short' })

export function RadioView({ data }: { data: RadioData }) {
  return (
    <>
      <h1>Radio</h1>

      <div className="stations">
        {data.stations.map((station) => (
          <section className="panel" key={station.name}>
            <h2>
              {station.name} <span className="meta">{station.frequency}</span>
            </h2>
            {station.error ? (
              <p className="notice">{station.error}</p>
            ) : (
              <ol className="tracks">
                {station.tracks?.length ? (
                  station.tracks.map((track) => (
                    <li className={`now-playing${track.playing ? ' is-playing' : ''}`} key={track.start}>
                      {track.image && <Image src={track.image} alt="" width={48} height={48} />}
                      <div>
                        <span className="meta">
                          {track.playing ? 'Now playing' : playedAt.format(new Date(track.start * 1000))}
                        </span>
                        <strong>{track.title}</strong>
                        <span>{track.artist}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="lead">No songs yet.</li>
                )}
              </ol>
            )}
          </section>
        ))}
      </div>

      <p className="source">Data: iHeartRadio (WEBN) and Triton Digital (WKRQ). Times are Cincinnati time.</p>
    </>
  )
}
