import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { ArtistMissing } from '@/components/ArtistMissing'
import { ArtistLibrary } from '@/lib/musicbrainz/library'
import { getPayloadClient } from '@/lib/payload'
import type { SearchParams } from '@/modules/HubModule'
import { param } from '@/modules/HubModule'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Artist' }

/** Open the artist page for a name as the radio spells it. */
export default async function ArtistLookupPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const name = param(await searchParams, 'name')
  if (!name) notFound()

  let mbid: string | null
  try {
    const artist = await new ArtistLibrary(await getPayloadClient()).find(name)
    mbid = artist?.mbid ?? null
  } catch {
    return <ArtistMissing message="MusicBrainz did not respond. Try again shortly." />
  }
  if (!mbid) return <ArtistMissing message={`MusicBrainz has no artist called “${name}”.`} />
  redirect(`/artists/${mbid}`)
}
