import { ArtistLibrary } from '@/lib/musicbrainz/library'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * The listener calls this with the artists on air, so their pages are ready
 * before anyone clicks. Internal only: it needs the shared PAYLOAD_SECRET.
 */
export async function POST(request: Request) {
  if (!process.env.PAYLOAD_SECRET || request.headers.get('x-listener-secret') !== process.env.PAYLOAD_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }
  const { names } = (await request.json()) as { names?: unknown }
  if (!Array.isArray(names) || !names.every((n) => typeof n === 'string')) {
    return Response.json({ error: 'Send {"names": ["Artist", ...]}' }, { status: 400 })
  }

  const library = new ArtistLibrary(await getPayloadClient())
  const results: Record<string, string | null> = {}
  for (const name of names.slice(0, 10)) {
    try {
      results[name] = (await library.find(name))?.name ?? null
    } catch {
      results[name] = null // MusicBrainz unavailable; the next prefetch tries again
    }
  }
  return Response.json({ results })
}
