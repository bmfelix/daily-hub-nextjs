import './score.css'

import type { AboutData } from './AboutModule'
import { PROFILE } from './profile'

const SCORE_FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500..700;1,500..700&family=EB+Garamond:ital,wght@0,400..600;1,400..600&display=swap'

export function AboutView({ data }: { data: AboutData }) {
  return (
    <div className="theme-score">
      <link rel="stylesheet" href={SCORE_FONTS} precedence="default" />
      <p className="kicker">Composed by</p>
      <h1>{PROFILE.name || 'About'}</h1>

      {PROFILE.headline && <p className="about-headline">{PROFILE.headline}</p>}
      {PROFILE.bio && (
        <div className="artist-about">
          {PROFILE.bio.split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}

      <ul className="artist-actions">
        {PROFILE.website && (
          <li>
            <a className="pill pill-solid" href={PROFILE.website} rel="noopener" target="_blank">
              Website
            </a>
          </li>
        )}
        <li>
          <a className="pill" href={`https://github.com/${data.username}`} rel="noopener" target="_blank">
            GitHub
          </a>
        </li>
        {PROFILE.email && (
          <li>
            <a className="pill" href={`mailto:${PROFILE.email}`}>
              Email
            </a>
          </li>
        )}
      </ul>

      <section className="artist-section about-section">
        <h2>Projects</h2>
        <ul className="project-list">
          {PROFILE.projects.map((project) => (
            <li className="panel" key={project.title}>
              <h3>{project.title}</h3>
              {project.description && <p>{project.description}</p>}
              <ul className="chips chips-quiet">
                {project.tech.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="project-links">
                {project.url && (
                  <a href={project.url} rel="noopener" target="_blank">
                    Live
                  </a>
                )}
                {project.repoUrl && (
                  <a href={project.repoUrl} rel="noopener" target="_blank">
                    Code
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {data.repositories.length > 0 && (
        <section className="artist-section about-section">
          <h2>Recently on GitHub</h2>
          <ul className="project-list">
            {data.repositories.map((repo) => (
              <li className="panel" key={repo.name}>
                <h3>
                  <a href={repo.url} rel="noopener" target="_blank">
                    {repo.name}
                  </a>
                </h3>
                {repo.description && <p>{repo.description}</p>}
                {repo.language && <span className="meta">{repo.language}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
