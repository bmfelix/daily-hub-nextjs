import { timingSafeEqual } from 'crypto'

import { authorizeUrl, connectState, isConfigured } from '@/lib/spotify'

export const dynamic = 'force-dynamic'

/**
 * Starts connecting the owner's Spotify account. There is no login on this
 * site, so the address needs ?key= set to SPOTIFY_CONNECT_KEY from .env.
 */
export async function GET(request: Request) {
  const given = Buffer.from(new URL(request.url).searchParams.get('key') ?? '')
  const expected = Buffer.from(process.env.SPOTIFY_CONNECT_KEY ?? '')
  if (!expected.length || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response('Forbidden', { status: 403 })
  }
  if (!isConfigured()) return new Response('Add your Spotify app ID and secret to .env first.', { status: 400 })
  return Response.redirect(authorizeUrl(connectState()), 302)
}
