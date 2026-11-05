type Entry = { value: unknown; expires: number }

// One store per process, also across hot reloads in development.
const shared = globalThis as typeof globalThis & { hubCache?: Map<string, Entry> }
const store = (shared.hubCache ??= new Map<string, Entry>())

/** Keep a result for a while, so free services are not asked on every page view. */
export async function remember<T>(key: string, seconds: number, load: () => Promise<T>): Promise<T> {
  const entry = store.get(key)
  if (entry && entry.expires > Date.now()) return entry.value as T
  const value = await load()
  store.set(key, { value, expires: Date.now() + seconds * 1000 })
  return value
}

export const clearCache = () => store.clear()
