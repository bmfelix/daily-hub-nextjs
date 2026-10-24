import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArtistMissing } from '@/components/ArtistMissing'
import { ArtistView } from '@/components/ArtistView'
import { MusicBrainzError } from '@/lib/musicbrainz/client'
import { ArtistLibrary } from '@/lib/musicbrainz/library'
import { artistProfile } from '@/lib/musicbrainz/profile'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ mbid: string }> }

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

async function library() {
  return new ArtistLibrary(await getPayloadClient())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mbid } = await params
  const artist = MBID.test(mbid) ? await (await library()).saved(mbid) : null
  return { title: artist?.name ?? 'Artist' }
}

/** One artist. Band members and related artists link here too, so fetch any not yet saved. */
export default async function ArtistPage({ params }: Props) {
  const { mbid } = await params
  if (!MBID.test(mbid)) notFound()

  let artist
  try {
    artist = await (await library()).save(mbid)
  } catch (error) {
    if (error instanceof MusicBrainzError && [400, 404].includes(error.status)) notFound()
    return <ArtistMissing message="MusicBrainz did not respond. Try again shortly." />
  }
  return <ArtistView artist={artistProfile(artist)} />
}
