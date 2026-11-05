import type { TrackSong } from '@/modules/radio/data'

export function PlayButton({ song }: { song: Pick<TrackSong, 'id' | 'title'> }) {
  return (
    <button className="play-button" type="button" aria-pressed="false" aria-label={`Play a preview of ${song.title}`} data-src={`/songs/${song.id}/preview`}>
      <svg className="play-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 2.5v11l9-5.5z" />
      </svg>
      <svg className="pause-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 2.5h3.2v11H3.5zM9.3 2.5h3.2v11H9.3z" />
      </svg>
    </button>
  )
}
