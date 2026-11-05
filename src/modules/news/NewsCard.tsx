import type { NewsData } from './NewsModule'

export function NewsCard({ data }: { data: NewsData }) {
  if ('error' in data) return <p>{data.error}</p>
  return (
    <ol className="card-mini-list">
      {data.stories.slice(0, 3).map((story, i) => (
        <li key={story.id}>
          <span className="number" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <a href={story.url} rel="noopener" target="_blank">
            {story.title}
          </a>
        </li>
      ))}
    </ol>
  )
}
