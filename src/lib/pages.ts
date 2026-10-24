import { getPayloadClient } from './payload'

// Both queries run as a visitor (overrideAccess: false), so drafts stay hidden.

export async function getMenuPages() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { showInMenu: { equals: true } },
    sort: 'title',
    pagination: false,
    select: { title: true, slug: true },
    overrideAccess: false,
  })
  return docs
}

export async function getPublishedPage(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
}
