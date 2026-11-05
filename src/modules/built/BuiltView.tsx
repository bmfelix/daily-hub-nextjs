import type { BuiltData } from './BuiltModule'

const REPOS = ['django', 'nextjs', 'laravel']

const ROWS = [
  ['Language', 'Python', 'TypeScript', 'PHP'],
  ['Framework', 'Django 6', 'Next.js 16, React 19', 'Laravel 13'],
  ['Content and admin', 'Django admin', 'Payload CMS', 'Eloquent models and config, no admin'],
  ['Live radio updates', 'Channels and Redis over WebSockets', 'Server-Sent Events', 'Reverb over WebSockets'],
  ['Pages', 'Class-based views and templates', 'React Server Components', 'Controllers and Blade'],
  ['Database', 'Postgres', 'Postgres', 'Postgres'],
]

const PIECES = [
  ['One class per page', 'Each menu link is a module that owns its page and its API calls. The menu, the homepage, and the URLs are all built from one list.'],
  ['A background listener', 'A separate process checks both stations every 15 seconds, updates open pages, saves plays for the charts, and looks up artists and song previews ahead of time.'],
  ['Everything is saved once', 'Artists and songs are fetched from MusicBrainz, Wikipedia, Apple, and Deezer one time, then stored, so pages stay fast and those free services are not overused.'],
  ['Tests run offline', 'Each outside service sits behind a small client class, so tests swap in a fake and never touch the internet.'],
]

export function BuiltView({ data }: { data: BuiltData }) {
  return (
    <>
      <p className="kicker">Behind the mixing desk</p>
      <h1>How it&apos;s built</h1>

      <p className="about-headline">
        Daily Hub is one app built three times, in Django, Next.js, and Laravel, so the frameworks can be compared side by side.
      </p>

      <section className="artist-section about-section">
        <h2>Three builds</h2>
        <div className="table-scroll">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col" />
                {Object.entries(data.sites).map(([name, url]) => (
                  <th scope="col" key={name}>
                    {url ? <a href={url}>{name}</a> : name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, ...cells]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cells.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">Code</th>
                {REPOS.map((repo) => (
                  <td key={repo}>
                    <a href={`https://github.com/bmfelix/daily-hub-${repo}`} rel="noopener" target="_blank">
                      daily-hub-{repo}
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="artist-section about-section">
        <h2>How the pieces work</h2>
        <ul className="project-list">
          {PIECES.map(([title, text]) => (
            <li className="panel" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
