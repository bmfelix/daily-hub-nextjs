import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getPublishedPage } from '@/lib/pages'
import { findModule } from '@/modules'
import type { SearchParams } from '@/modules/HubModule'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const title = findModule(slug)?.title ?? (await getPublishedPage(slug))?.title
  return title ? { title } : {}
}

/** A module page if the slug names a module, otherwise a published CMS page. */
export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params

  const hubModule = findModule(slug)
  if (hubModule) {
    const data = await hubModule.load(await searchParams)
    return <hubModule.View data={data} />
  }

  const page = await getPublishedPage(slug)
  if (!page) notFound()

  return (
    <article className="cms-page">
      <h1>{page.title}</h1>
      {page.content && <RichText data={page.content} />}
    </article>
  )
}
