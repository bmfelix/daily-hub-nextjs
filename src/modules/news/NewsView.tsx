import type { NewsData } from './NewsModule'

export function NewsView({ data }: { data: NewsData }) {
  return (
    <>
      <p className="kicker">Today&apos;s headliners</p>
      <h1>News</h1>

      {'error' in data ? (
        <p className="notice">{data.error}</p>
      ) : (
        <ol className="headlines">
          {data.stories.map((story) => (
            <li key={story.id}>
              <a className="headline" href={story.url} rel="noopener" target="_blank">
                {story.title}
              </a>
              <span className="meta">
                {story.points} points · by {story.author} ·{' '}
                <a href={story.discussion} rel="noopener" target="_blank">
                  {story.comments} comments
                </a>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="source">Data: Hacker News</p>
    </>
  )
}
