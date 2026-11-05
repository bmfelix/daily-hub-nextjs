import type { TrackSong } from '@/modules/radio/data'

import { PlayButton } from './PlayButton'

export function SongPlayer({ song }: { song: TrackSong }) {
  const search = encodeURIComponent(`${song.artistName} ${song.title}`)
  return (
    <>
      {song.hasPreview && <PlayButton song={song} />}
      <span className="song-links meta">
        {song.appleUrl && (
          <a href={song.appleUrl} rel="noopener" target="_blank">
            Apple Music
          </a>
        )}
        {song.deezerUrl && (
          <a href={song.deezerUrl} rel="noopener" target="_blank">
            Deezer
          </a>
        )}
        <a href={`https://open.spotify.com/search/${search}`} rel="noopener" target="_blank">
          Spotify
        </a>
        <a href={`https://music.youtube.com/search?q=${search}`} rel="noopener" target="_blank">
          YouTube Music
        </a>
      </span>
    </>
  )
}
