import { radioUpdates } from '@/lib/radioUpdates'

export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25000

/**
 * Server-Sent Events stream of Radio card updates. The browser keeps this open;
 * each message is the card data the listener announced.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let stop = () => {}

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          stop() // the browser has gone
        }
      }

      send('retry: 5000\n\n') // ask the browser to wait 5 seconds before reconnecting
      const unsubscribe = await radioUpdates.subscribe((payload) => send(`data: ${payload}\n\n`))
      // A comment line every 25 seconds keeps proxies from closing an idle stream.
      const heartbeat = setInterval(() => send(': keep-alive\n\n'), HEARTBEAT_MS)

      stop = () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
      request.signal.addEventListener('abort', () => {
        stop()
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      stop()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
