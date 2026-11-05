import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/lib/payload'
import { connectAccount, validState } from '@/lib/spotify'

export const dynamic = 'force-dynamic'

/** Spotify returns here. The signed state shows this began at /spotify/connect. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (!validState(searchParams.get('state') ?? '')) {
    return new Response('This Spotify link has expired. Start again.', { status: 400 })
  }
  const code = searchParams.get('code')
  if (!code) redirect('/') // access was refused
  try {
    await connectAccount(await getPayloadClient(), code)
  } catch {
    return new Response('Spotify did not respond. Try connecting again.', { status: 503 })
  }
  redirect('/')
}
