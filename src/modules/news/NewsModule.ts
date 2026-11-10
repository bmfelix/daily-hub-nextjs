import { HubModule } from '../HubModule'
import { type FeedItem, GoogleNewsClient } from './GoogleNewsClient'
import { NewsCard } from './NewsCard'
import { NewsView } from './NewsView'

export type Story = {
  id: string
  title: string
  url: string
  source: string
  /** When it was published, as an ISO date, or null if the feed did not say. */
  published: string | null
}

export type NewsData = { error: string } | { stories: Story[] }

/** Google adds " - Source" to every title; the page shows the source on its own line instead. */
function headline(item: FeedItem): string {
  const suffix = ` - ${item.source}`
  return item.source && item.title.endsWith(suffix)
    ? item.title.slice(0, -suffix.length)
    : item.title
}

function published(date: string): string | null {
  const time = Date.parse(date)
  return Number.isNaN(time) ? null : new Date(time).toISOString()
}

export class NewsModule extends HubModule<NewsData, NewsData> {
  readonly slug = 'news'
  readonly title = 'News'
  readonly summary = 'Top stories from Google News.'
  readonly View = NewsView
  readonly Card = NewsCard

  constructor(private client = new GoogleNewsClient()) {
    super()
  }

  async load(): Promise<NewsData> {
    try {
      const items = await this.client.topStories()
      return {
        stories: items.map((item, i) => ({
          id: item.link || String(i),
          title: headline(item),
          url: item.link,
          source: item.source,
          published: published(item.published),
        })),
      }
    } catch {
      return { error: 'The news service did not respond. Try again shortly.' }
    }
  }

  card() {
    return this.load()
  }
}
