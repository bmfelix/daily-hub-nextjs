// Radio listener: runs in its own container (see docker-compose.yml).
// Every 15 seconds it checks the stations; when a song changes it sends the new
// card data through Postgres NOTIFY. Web servers LISTEN and pass it to browsers.

import pg from 'pg'

import { currentArtists, RADIO_CHANNEL, RadioListener } from '../modules/radio/data'

const intervalMs = Number(process.env.RADIO_INTERVAL_SECONDS ?? 15) * 1000
// The website looks up and saves artists; the listener only tells it who is on air.
const webUrl = process.env.WEB_URL ?? 'http://web:3000'

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
// A lost database connection ends the process; Docker restarts it.
client.on('error', (error) => {
  console.error('Database connection lost:', error.message)
  process.exit(1)
})
await client.connect()

const listener = new RadioListener(async (data) => {
  await client.query('SELECT pg_notify($1, $2)', [RADIO_CHANNEL, JSON.stringify(data)])
})

console.log(`Listening for song changes every ${intervalMs / 1000} seconds.`)

let lastPrefetched = ''

/** Ask the website to look up the artists on air, so their pages open instantly. */
async function prefetchArtists() {
  const names = currentArtists(listener.lastData)
  if (!names.length || names.join('|') === lastPrefetched) return
  const response = await fetch(`${webUrl}/artists/prefetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-listener-secret': process.env.PAYLOAD_SECRET ?? '' },
    body: JSON.stringify({ names }),
    signal: AbortSignal.timeout(120_000), // a big artist's first lookup can take a while
  })
  if (!response.ok) throw new Error(`prefetch returned ${response.status}`)
  lastPrefetched = names.join('|')
  console.log('Artists ready:', JSON.stringify((await response.json()).results))
}

async function tick() {
  try {
    if (await listener.check()) console.log('Broadcast:', listener.lastSeen)
  } catch (error) {
    console.error('Check failed:', error) // keep listening through any one bad check
  }
  try {
    await prefetchArtists()
  } catch (error) {
    console.error('Artist prefetch failed:', error)
  }
  setTimeout(tick, intervalMs)
}

await tick()
