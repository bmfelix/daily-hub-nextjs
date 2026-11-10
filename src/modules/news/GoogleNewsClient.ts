const FEED_URL = 'https://news.google.com/rss'
const FEED_PARAMS = { hl: 'en-US', gl: 'US', ceid: 'US:en' } // US top stories, in English

export type FeedItem = { title: string; link: string; published: string; source: string }

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** Undo XML escaping (&amp;, &#39;, …) and unwrap CDATA. */
function text(value: string): string {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (entity, code: string) => {
      if (code[0] === '#')
        return String.fromCodePoint(
          parseInt(code.slice(1).replace(/^x/i, ''), code[1].toLowerCase() === 'x' ? 16 : 10),
        )
      return ENTITIES[code] ?? entity
    })
    .trim()
}

const field = (item: string, tag: string) =>
  text(item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ?? '')

/** The stories in a Google News RSS feed, in order. Throws if it is not a feed. */
export function parseFeed(xml: string): FeedItem[] {
  if (!/<rss\b/.test(xml)) throw new Error('Google News returned something other than RSS')
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    title: field(item, 'title'),
    link: field(item, 'link'),
    published: field(item, 'pubDate'),
    source: field(item, 'source'),
  }))
}

/** Reads Google News' public top-stories feed (RSS), which needs no key. */
export class GoogleNewsClient {
  timeout = 8000

  async topStories(limit = 20): Promise<FeedItem[]> {
    const response = await fetch(`${FEED_URL}?${new URLSearchParams(FEED_PARAMS)}`, {
      cache: 'no-store',
      headers: { 'User-Agent': 'DailyHub/1.0' },
      signal: AbortSignal.timeout(this.timeout),
    })
    if (!response.ok) throw new Error(`Google News returned ${response.status}`)
    return parseFeed(await response.text()).slice(0, limit)
  }
}
