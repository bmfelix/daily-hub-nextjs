import { MusicClient } from '@/lib/music/client'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Send the audio player to a preview. Deezer's addresses expire, so each is fetched as it is played. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return new Response('Not found', { status: 404 })

  const payload = await getPayloadClient()
  const song = await payload.findByID({ collection: 'songs', id, disableErrors: true, depth: 0 })
  if (!song) return new Response('Not found', { status: 404 })
  if (song.applePreviewUrl) return Response.redirect(song.applePreviewUrl, 302)
  if (!song.deezerTrackId) return new Response('Not found', { status: 404 })

  try {
    const url = await new MusicClient().deezerPreview(song.deezerTrackId)
    return url ? Response.redirect(url, 302) : new Response('Not found', { status: 404 })
  } catch {
    return new Response('The preview service did not respond.', { status: 503 })
  }
}
