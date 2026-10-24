import Link from 'next/link'

import { MODULES } from '@/modules'

export const metadata = { title: 'Home' }

// Some cards show live data, so render on every request.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const cards = await Promise.all(
    MODULES.map(async (hubModule) => ({ hubModule, data: hubModule.Card ? await hubModule.card() : undefined })),
  )

  return (
    <>
      <h1>Your day at a glance</h1>
      <p className="lead">Pick a module from the menu or below.</p>

      <div className="cards">
        {cards.map(({ hubModule, data }) => (
          <Link className="card" href={`/${hubModule.slug}`} key={hubModule.slug}>
            <h2>{hubModule.title}</h2>
            {hubModule.Card && data !== undefined ? <hubModule.Card data={data} /> : <p>{hubModule.summary}</p>}
          </Link>
        ))}
      </div>
    </>
  )
}
