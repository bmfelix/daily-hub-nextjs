import './news.css'

import type { NewsData } from './NewsModule'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=UnifrakturMaguntia&display=swap'
const TIME_ZONE = 'America/New_York'
const today = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
const postedAt = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function NewsView({ data }: { data: NewsData }) {
  return (
    <div className="theme-news">
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <article className="paper">
        <header className="paper-masthead">
          <p className="paper-ears">
            <span>Cincinnati edition</span>
            <span>Top stories</span>
          </p>
          <h1 className="paper-title">The Daily Hub</h1>
          <p className="paper-dateline">
            <span>{today.format(new Date())}</span>
            <span>News</span>
            <span>Free</span>
          </p>
        </header>

        {'error' in data ? (
          <p className="notice">{data.error}</p>
        ) : (
          <ol className="paper-stories">
            {data.stories.map((story, i) => (
              <li className={`paper-story${i === 0 ? ' paper-lead' : ''}`} key={story.id}>
                <a className="paper-headline" href={story.url} rel="noopener" target="_blank">
                  {story.title}
                </a>
                <span className="paper-byline">
                  {story.source}
                  {story.published && (
                    <>
                      {story.source && ' · '}
                      <time dateTime={story.published}>
                        {postedAt.format(new Date(story.published))}
                      </time>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="source">Data: Google News</p>
      </article>
    </div>
  )
}
