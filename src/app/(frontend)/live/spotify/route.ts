import { getPayloadClient } from '@/lib/payload'
import { isConfigured, listening } from '@/lib/spotify'

export const dynamic = 'force-dynamic'

/** What the homepage's Spotify panel shows. */
export async function GET() {
  try {
    return Response.json({ track: await listening(await getPayloadClient()), configured: isConfigured() })
  } catch {
    return Response.json({ track: null, configured: true, error: 'Spotify did not respond. Try again shortly.' })
  }
}
