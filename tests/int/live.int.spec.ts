import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { GET } from '@/app/(frontend)/live/radio/route'
import { RADIO_CHANNEL } from '@/modules/radio/data'

// Uses the real Postgres LISTEN/NOTIFY path, like the listener container does.

let notifier: pg.Client

beforeAll(async () => {
  notifier = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await notifier.connect()
})
afterAll(() => notifier.end())

/** Read from the stream until the text contains `marker`. */
async function readUntil(reader: ReadableStreamDefaultReader<Uint8Array>, marker: string) {
  const decoder = new TextDecoder()
  let text = ''
  while (!text.includes(marker)) {
    const { value, done } = await reader.read()
    if (done) break
    text += decoder.decode(value)
  }
  return text
}

describe('/live/radio', () => {
  it('streams each NOTIFY to the browser as a Server-Sent Event', async () => {
    const abort = new AbortController()
    const response = await GET(new Request('http://localhost/live/radio', { signal: abort.signal }))
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    const reader = response.body!.getReader()
    expect(await readUntil(reader, 'retry:')).toContain('retry: 5000')

    const card = { stations: [{ name: 'WEBN', frequency: '102.7 FM', tracks: [] }] }
    // The subscription connects while the stream starts; give LISTEN a moment.
    await new Promise((resolve) => setTimeout(resolve, 300))
    await notifier.query('SELECT pg_notify($1, $2)', [RADIO_CHANNEL, JSON.stringify(card)])

    const text = await readUntil(reader, 'data:')
    expect(text).toContain(`data: ${JSON.stringify(card)}\n\n`)

    abort.abort()
    await reader.cancel().catch(() => {})
  })
})
