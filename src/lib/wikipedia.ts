// Artist background from English Wikipedia. Its text is CC BY-SA, so pages credit and link it.

const API_URL = 'https://en.wikipedia.org/w/api.php'
const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php'
const USER_AGENT = 'DailyHub/1.0 (https://github.com/bmfelix/daily-hub-nextjs)'

// A page found by name only counts if its description sounds like a music act.
const MUSIC_WORDS = /\b(band|singer|musician|rapper|group|duo|trio|songwriter|dj|vocalist|producer|composer|guitarist|supergroup)\b/i

export type WikipediaPage = { title: string; url: string; summary: string; description: string; image: string }

type ArtistRecord = { name: string; relations?: { url?: { resource?: string } }[] }

type QueryResult = {
  query?: {
    pages?: {
      title: string
      fullurl: string
      extract?: string
      description?: string
      missing?: boolean
      pageprops?: Record<string, string>
      thumbnail?: { source: string }
    }[]
  }
}

export class WikipediaClient {
  timeout = 8000

  private async get<T>(url: string, params: Record<string, string>): Promise<T> {
    const query = new URLSearchParams({ ...params, format: 'json', formatversion: '2' })
    const response = await fetch(`${url}?${query}`, {
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(this.timeout),
    })
    if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`)
    return response.json() as Promise<T>
  }

  /** The title, address, description, and opening text of a page, or null. */
  async page(title: string): Promise<WikipediaPage | null> {
    const data = await this.get<QueryResult>(API_URL, {
      action: 'query',
      titles: title,
      redirects: '1',
      prop: 'extracts|info|description|pageprops|pageimages',
      exintro: '1',
      explaintext: '1',
      inprop: 'url',
      ppprop: 'disambiguation',
      piprop: 'thumbnail', // pageimages only returns free images by default
      pithumbsize: '640',
    })
    const page = data.query?.pages?.[0]
    if (!page || page.missing || page.pageprops?.disambiguation !== undefined || !page.extract) return null
    return {
      title: page.title,
      url: page.fullurl,
      summary: page.extract.trim(),
      description: page.description ?? '',
      image: page.thumbnail?.source ?? '',
    }
  }

  /** The page title MusicBrainz links to, directly or through Wikidata. */
  async linkedTitle(record: ArtistRecord): Promise<string | null> {
    let wikidata: string | null = null
    for (const relation of record.relations ?? []) {
      const url = relation.url?.resource ?? ''
      const direct = url.match(/\/\/en\.wikipedia\.org\/wiki\/(.+)$/)
      if (direct) return decodeURIComponent(direct[1]).replaceAll('_', ' ')
      wikidata = url.match(/wikidata\.org\/wiki\/(Q\d+)/)?.[1] ?? wikidata
    }
    if (!wikidata) return null
    const data = await this.get<{ entities?: Record<string, { sitelinks?: { enwiki?: { title: string } } }> }>(WIKIDATA_API_URL, {
      action: 'wbgetentities',
      ids: wikidata,
      props: 'sitelinks',
      sitefilter: 'enwiki',
    })
    return data.entities?.[wikidata]?.sitelinks?.enwiki?.title ?? null
  }

  /** The Wikipedia page for a MusicBrainz artist record, or null. */
  async find(record: ArtistRecord): Promise<WikipediaPage | null> {
    const title = await this.linkedTitle(record)
    const page = title ? await this.page(title) : null
    if (page) return page
    const { name } = record
    for (const candidate of [name, `${name} (band)`, `${name} (musician)`, `${name} (singer)`]) {
      const found = await this.page(candidate)
      if (found && MUSIC_WORDS.test(found.description)) return found
    }
    return null
  }
}
