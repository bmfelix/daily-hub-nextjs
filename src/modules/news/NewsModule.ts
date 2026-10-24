import { HubModule } from '../HubModule'
import { HackerNewsClient } from './HackerNewsClient'
import { NewsView } from './NewsView'

export type Story = {
  id: string
  title: string
  url: string
  discussion: string
  points: number
  comments: number
  author: string
}

export type NewsData = { error: string } | { stories: Story[] }

export class NewsModule extends HubModule<NewsData> {
  readonly slug = 'news'
  readonly title = 'News'
  readonly summary = 'Top headlines from the Hacker News front page.'
  readonly View = NewsView

  constructor(private client = new HackerNewsClient()) {
    super()
  }

  async load(): Promise<NewsData> {
    try {
      const hits = await this.client.frontPage()
      return {
        stories: hits.map((hit) => {
          const discussion = `https://news.ycombinator.com/item?id=${hit.objectID}`
          return {
            id: hit.objectID,
            title: hit.title,
            url: hit.url || discussion,
            discussion,
            points: hit.points ?? 0,
            comments: hit.num_comments ?? 0,
            author: hit.author,
          }
        }),
      }
    } catch {
      return { error: 'The news service did not respond. Try again shortly.' }
    }
  }
}
