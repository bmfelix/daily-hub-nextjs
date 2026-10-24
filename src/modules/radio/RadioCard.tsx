import Image from 'next/image'

import Link from 'next/link'

import { artistUrl, type RadioData } from './data'

export function RadioCard({ data }: { data: RadioData }) {
  return (
    <ul className="now-playing-list">
      {data.stations.map((station) => {
        const track = station.tracks?.[0]
        const status = track ? (track.playing ? 'Now playing' : 'Last played') : 'Unavailable'
        return (
          <li className="now-playing" key={station.name}>
            {track?.image && <Image src={track.image} alt="" width={48} height={48} />}
            <div>
              <span className="meta">
                {station.name} · {status}
              </span>
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
            </div>
          </li>
        )
      })}
    </ul>
  )
}
