import pg from 'pg'

import { RADIO_CHANNEL } from '@/modules/radio/data'

type Subscriber = (payload: string) => void

const RECONNECT_MS = 5000

/**
 * One Postgres LISTEN connection per server process, shared by every open
 * browser stream. Each NOTIFY from the listener is passed to all subscribers.
 */
class RadioUpdates {
  private subscribers = new Set<Subscriber>()
  private client: pg.Client | null = null
  private connecting: Promise<void> | null = null

  /** Start receiving updates. Returns a function that stops them. */
  async subscribe(subscriber: Subscriber): Promise<() => void> {
    this.subscribers.add(subscriber)
    await this.connect()
    return () => {
      this.subscribers.delete(subscriber)
      if (this.subscribers.size === 0) this.disconnect()
    }
  }

  private connect(): Promise<void> {
    if (this.client) return Promise.resolve()
    this.connecting ??= this.open().finally(() => (this.connecting = null))
    return this.connecting
  }

  private async open() {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    client.on('notification', ({ payload }) => {
      if (payload) for (const subscriber of this.subscribers) subscriber(payload)
    })
    client.on('error', () => {
      // Drop the broken connection and try again while anyone is still watching.
      this.client = null
      client.end().catch(() => {})
      setTimeout(() => this.subscribers.size && this.connect().catch(() => {}), RECONNECT_MS)
    })
    await client.connect()
    await client.query(`LISTEN ${RADIO_CHANNEL}`)
    this.client = client
  }

  private disconnect() {
    this.client?.end().catch(() => {})
    this.client = null
  }
}

// Keep one instance per process, also across hot reloads in development.
const shared = globalThis as typeof globalThis & { radioUpdates?: RadioUpdates }
export const radioUpdates = (shared.radioUpdates ??= new RadioUpdates())
