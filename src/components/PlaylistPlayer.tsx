'use client'

import { useState } from 'react'

/** Spotify's own player, with numbered buttons when there are several playlists. */
export function PlaylistPlayer({ playlists }: { playlists: string[] }) {
  const [chosen, setChosen] = useState(0)

  return (
    <div className="spotify-player">
      {playlists.length > 1 && (
        <div className="playlist-buttons" role="group" aria-label="Choose a playlist">
          {playlists.map((playlist, i) => (
            <button
              className={`pill${i === chosen ? ' is-chosen' : ''}`}
              type="button"
              aria-pressed={i === chosen}
              aria-label={`Playlist ${i + 1}`}
              key={playlist}
              onClick={() => setChosen(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      <iframe
        className="spotify-playlist"
        title="Spotify playlist"
        src={playlists[chosen]}
        height={352}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  )
}
