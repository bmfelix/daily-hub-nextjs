const SEARCH_URL = 'https://hn.algolia.com/api/v1/search'

export type Hit = {
  objectID: string
  title: string
  url: string | null
  points: number | null
  num_comments: number | null
  author: string
}

/** Talks to the Hacker News search API (by Algolia), which needs no key. */
export class HackerNewsClient {
  timeout = 8000

  async frontPage(limit = 20): Promise<Hit[]> {
    const url = `${SEARCH_URL}?${new URLSearchParams({ tags: 'front_page', hitsPerPage: String(limit) })}`
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(this.timeout) })
    if (!response.ok) throw new Error(`Hacker News returned ${response.status}`)
    const data = (await response.json()) as { hits: Hit[] }
    return data.hits
  }
}
