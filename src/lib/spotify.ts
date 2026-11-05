import { createHmac, timingSafeEqual } from 'crypto'

import type { Payload } from 'payload'

import { remember } from './cache'

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_URL = 'https://api.spotify.com/v1'
const SCOPES = 'user-read-currently-playing user-read-recently-played user-top-read'
const LISTENING_SECONDS = 20 // the homepage asks every 30 seconds, for every open page
const TOP_SECONDS = 60 * 60
const STATE_MS = 10 * 60 * 1000

const redirectUri = () => process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/spotify/callback'
const clientId = () => process.env.SPOTIFY_CLIENT_ID ?? ''
const clientSecret = () => process.env.SPOTIFY_CLIENT_SECRET ?? ''

export const isConfigured = () => Boolean(clientId() && clientSecret())

/** A Spotify player address for each playlist link in SPOTIFY_PLAYLIST_URL (comma separated). */
export function playlistEmbeds(): string[] {
  return [...(process.env.SPOTIFY_PLAYLIST_URL ?? '').matchAll(/playlist[/:]([A-Za-z0-9]+)/g)].map(
    ([, id]) => `https://open.spotify.com/embed/playlist/${id}?theme=0`,
  )
}

export type Track = {
  title: string
  artist: string
  firstArtist: string
  album: string
  artwork: string
  url: string
  playing: boolean
  playedAt: string | null
}
export type TopArtist = { name: string; image: string; genres: string[]; url: string }
export type TopItems = { tracks: Track[]; artists: TopArtist[] }

type RawTrack = {
  name: string
  artists?: { name: string }[]
  album?: { name?: string; images?: { url: string }[] }
  external_urls?: { spotify?: string }
}
type RawArtist = { name: string; images?: { url: string }[]; genres?: string[]; external_urls?: { spotify?: string } }

function trackDetails(track: RawTrack, playing: boolean, playedAt: string | null = null): Track {
  const artists = (track.artists ?? []).map((artist) => artist.name)
  return {
    title: track.name,
    artist: artists.join(', '),
    firstArtist: artists[0] ?? '',
    album: track.album?.name ?? '',
    artwork: track.album?.images?.[0]?.url ?? '',
    url: track.external_urls?.spotify ?? '',
    playing,
    playedAt,
  }
}

function artistDetails(artist: RawArtist): TopArtist {
  const images = artist.images ?? []
  return {
    name: artist.name,
    image: images[images.length - 2]?.url ?? images[0]?.url ?? '',
    genres: (artist.genres ?? []).slice(0, 3),
    url: artist.external_urls?.spotify ?? '',
  }
}

const sign = (time: string) => createHmac('sha256', process.env.PAYLOAD_SECRET ?? '').update(`spotify:${time}`).digest('hex')

/** A short-lived value showing a connection began with /spotify/connect. */
export function connectState(now = Date.now()): string {
  return `${now}.${sign(String(now))}`
}

export function validState(state: string, now = Date.now()): boolean {
  const [time, signature = ''] = state.split('.')
  const expected = Buffer.from(sign(time))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given) && now - Number(time) <= STATE_MS
}

export function authorizeUrl(state: string): string {
  return `${AUTHORIZE_URL}?${new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    state,
  })}`
}

type Tokens = { access_token: string; refresh_token?: string; expires_in: number }

async function requestToken(data: Record<string, string>): Promise<Tokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Spotify returned ${response.status}`)
  return response.json() as Promise<Tokens>
}

const expiry = (tokens: Tokens) => new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString()

export async function connectAccount(payload: Payload, code: string): Promise<void> {
  const tokens = await requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() })
  await payload.delete({ collection: 'spotify-accounts', where: { id: { exists: true } } })
  await payload.create({
    collection: 'spotify-accounts',
    data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? '', expiresAt: expiry(tokens) },
  })
}

async function freshToken(payload: Payload): Promise<string | null> {
  const { docs } = await payload.find({ collection: 'spotify-accounts', limit: 1 })
  const account = docs[0]
  if (!account) return null
  if (Date.now() < new Date(account.expiresAt).getTime()) return account.accessToken
  const tokens = await requestToken({ grant_type: 'refresh_token', refresh_token: account.refreshToken })
  await payload.update({
    collection: 'spotify-accounts',
    id: account.id,
    // Spotify may or may not send a new refresh token; keep the old one if not.
    data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? account.refreshToken, expiresAt: expiry(tokens) },
  })
  return tokens.access_token
}

async function get<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T | null> {
  const query = new URLSearchParams(params)
  const response = await fetch(`${API_URL}/${path}?${query}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Spotify returned ${response.status}`)
  return response.status === 204 ? null : (response.json() as Promise<T>) // 204: nothing is playing
}

/** What is playing now, or else what played last. Null if not connected. */
export async function listening(payload: Payload): Promise<Track | null> {
  return remember('spotify-listening', LISTENING_SECONDS, async () => {
    const token = await freshToken(payload)
    if (!token) return null
    const now = await get<{ is_playing?: boolean; item?: RawTrack | null }>(token, 'me/player/currently-playing')
    if (now?.is_playing && now.item) return trackDetails(now.item, true)
    const recent = await get<{ items?: { track: RawTrack; played_at: string }[] }>(token, 'me/player/recently-played', { limit: '1' })
    const last = recent?.items?.[0]
    return last ? trackDetails(last.track, false, last.played_at) : null
  })
}

/** Top tracks and artists for a period. Null if not connected. */
export async function topItems(payload: Payload, range: string): Promise<TopItems | null> {
  return remember(`spotify-top-${range}`, TOP_SECONDS, async () => {
    const token = await freshToken(payload)
    if (!token) return null
    const params = { time_range: range, limit: '10' }
    const tracks = await get<{ items?: RawTrack[] }>(token, 'me/top/tracks', params)
    const artists = await get<{ items?: RawArtist[] }>(token, 'me/top/artists', params)
    return {
      tracks: (tracks?.items ?? []).map((track) => trackDetails(track, false)),
      artists: (artists?.items ?? []).map(artistDetails),
    }
  })
}
