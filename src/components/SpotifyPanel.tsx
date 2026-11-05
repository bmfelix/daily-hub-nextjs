'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { Track } from '@/lib/spotify'
import { artistUrl } from '@/modules/radio/data'

import { HideOnError } from './HideOnError'

type Reply = { track: Track | null; configured: boolean; error?: string }

const REFRESH_MS = 30_000

function ago(date: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours} hour${hours === 1 ? '' : 's'} ago` : `${Math.round(hours / 24)} days ago`
}

/** What is playing on Spotify, asked for after the page opens and every 30 seconds. */
export function SpotifyPanel() {
  const [reply, setReply] = useState<Reply | null>(null)

  useEffect(() => {
    const load = () =>
      fetch('/live/spotify')
        .then((response) => response.json())
        .then(setReply)
        .catch(() => {})
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  if (!reply) return <p>Checking Spotify…</p>
  if (reply.error) return <p>{reply.error}</p>
  if (!reply.configured) return <p>Spotify listening is not set up yet.</p>
  const { track } = reply
  if (!track) return <p>Nothing to show yet.</p>

  return (
    <div className="now-playing">
      <span className="art">{track.artwork && <HideOnError src={track.artwork} alt="" width={230} height={230} />}</span>
      <div>
        <span className={`on-air${track.playing ? ' is-live' : ''}`}>
          {track.playing ? 'Playing now' : `Last played ${track.playedAt ? ago(track.playedAt) : ''}`}
        </span>
        <strong>{track.title}</strong>
        <Link className="artist-link" href={artistUrl(track.firstArtist)} prefetch={false}>
          {track.artist}
        </Link>
        {track.album && <span className="meta">{track.album}</span>}
        {track.url && (
          <a className="spotify-open" href={track.url} rel="noopener" target="_blank">
            Open in Spotify
          </a>
        )}
        <Link className="spotify-open" href="/listening">
          Listening stats
        </Link>
      </div>
    </div>
  )
}
