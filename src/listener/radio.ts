// Radio listener: runs in its own container (see docker-compose.yml).
// Every 15 seconds it checks the stations; when a song changes it sends the new
// card data through Postgres NOTIFY. Web servers LISTEN and pass it to browsers.

import pg from 'pg'

import { RADIO_CHANNEL, RadioListener } from '../modules/radio/data'

const intervalMs = Number(process.env.RADIO_INTERVAL_SECONDS ?? 15) * 1000

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

async function tick() {
  try {
    if (await listener.check()) console.log('Broadcast:', listener.lastSeen)
  } catch (error) {
    console.error('Check failed:', error) // keep listening through any one bad check
  }
  setTimeout(tick, intervalMs)
}

await tick()
