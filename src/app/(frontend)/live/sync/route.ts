import { ArtistLibrary } from '@/lib/musicbrainz/library'
import { getPayloadClient } from '@/lib/payload'
import { syncRadio } from '@/modules/radio/songs'

export const dynamic = 'force-dynamic'

const ARTISTS_PER_SYNC = 2 // fill in saved artists a few at a time

/**
 * The listener calls this after a song changes, and until nothing is waiting.
 * Internal only: it needs the shared PAYLOAD_SECRET.
 */
export async function POST(request: Request) {
  if (!process.env.PAYLOAD_SECRET || request.headers.get('x-listener-secret') !== process.env.PAYLOAD_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }
  const payload = await getPayloadClient()
  const result = await syncRadio(payload)
  const artists = await new ArtistLibrary(payload).fillMissing(ARTISTS_PER_SYNC)
  return Response.json({ ...result, waiting: result.waiting + artists })
}
