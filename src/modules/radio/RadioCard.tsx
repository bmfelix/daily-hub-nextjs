import Link from 'next/link'

import { HideOnError } from '@/components/HideOnError'
import { LiveButton } from '@/components/LiveButton'
import { PlayButton } from '@/components/PlayButton'

import { artistUrl, type RadioData } from './data'

export function RadioCard({ data }: { data: RadioData }) {
  return (
    <div className="station-cards">
      {data.stations.map((station) => {
        const track = station.tracks?.[0]
        const status = track ? (track.playing ? 'On air' : 'Last played') : 'Unavailable'
        const art = track?.image || track?.song?.artworkUrl
        return (
          <div className="card card-station" key={station.name}>
            <h2>
              <Link className="card-link" href="/radio">
                {station.name}
              </Link>
              <span className="meta">{station.frequency}</span>
            </h2>
            <div className="now-playing">
              <span className="art">{art && <HideOnError src={art} alt="" width={150} height={150} />}</span>
              <div>
                <span className={`on-air${track?.playing ? ' is-live' : ''}`}>{status}</span>
                {track ? (
                  <>
                    <strong>{track.title}</strong>
                    <Link className="artist-link" href={artistUrl(track.artist)} prefetch={false}>
                      {track.artist}
                    </Link>
                  </>
                ) : (
                  <span>{station.error ?? 'No songs yet.'}</span>
                )}
                <div className="card-actions">
                  <LiveButton name={station.name} streamUrl={station.streamUrl} />
                  {track?.song?.hasPreview && (
                    <>
                      <PlayButton song={track.song} />
                      <span className="meta">Song preview</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
