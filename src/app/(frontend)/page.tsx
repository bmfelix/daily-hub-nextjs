import Link from 'next/link'
import { Suspense } from 'react'

import { PlaylistPlayer } from '@/components/PlaylistPlayer'
import { SpotifyPanel } from '@/components/SpotifyPanel'
import { playlistEmbeds } from '@/lib/spotify'
import { MODULES } from '@/modules'
import type { HubModule } from '@/modules/HubModule'

export const metadata = { title: 'Home' }

// Some cards show live data, so render on every request.
export const dynamic = 'force-dynamic'

const today = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each module has its own data type
async function ModuleCard({ hubModule }: { hubModule: HubModule<any, any> }) {
  if (!hubModule.Card) return <p>{hubModule.summary}</p>
  const data = await hubModule.card()
  return <hubModule.Card data={data} />
}

export default async function HomePage() {
  const playlists = playlistEmbeds()

  return (
    <>
      <header className="home-intro">
        <p className="kicker">{today.format(new Date())}</p>
        <h1>
          My day, <em>on repeat.</em>
        </h1>
      </header>

      <div className="board">
        <div className="card card-spotify">
          <h2>Spotify</h2>
          <div className={`spotify-layout${playlists.length ? '' : ' is-single'}`}>
            <div className="spotify-listening">
              <SpotifyPanel />
            </div>
            {playlists.length > 0 && <PlaylistPlayer playlists={playlists} />}
          </div>
        </div>

        {MODULES.filter((hubModule) => hubModule.onHome).map((hubModule) =>
          hubModule.slug === 'radio' ? (
            <Suspense key={hubModule.slug}>
              <ModuleCard hubModule={hubModule} />
            </Suspense>
          ) : (
            <div className={`card card-${hubModule.slug}`} key={hubModule.slug}>
              <h2>
                <Link className="card-link" href={`/${hubModule.slug}`}>
                  {hubModule.title}
                </Link>
              </h2>
              {/* A slow service never holds up the page: its card streams in when ready. */}
              <Suspense fallback={<p>{hubModule.summary}</p>}>
                <ModuleCard hubModule={hubModule} />
              </Suspense>
            </div>
          ),
        )}
      </div>
    </>
  )
}
