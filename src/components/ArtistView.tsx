import Link from 'next/link'

import type { ArtistProfile, Person } from '@/lib/musicbrainz/profile'

import { HideOnError } from './HideOnError'

const savedOn = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

function People({ people, details = true }: { people: Person[]; details?: boolean }) {
  return (
    <ul className="people">
      {people.map((person) => (
        <li className={`person${person.current ? '' : ' is-former'}`} key={person.mbid}>
          <span className="avatar" aria-hidden="true">
            {person.name.charAt(0)}
          </span>
          <div>
            <Link href={`/artists/${person.mbid}`} prefetch={false}>
              {person.name}
            </Link>
            <span className="meta">
              {person.years}
              {details && person.original && ' · original member'}
              {details && !person.current && ' · former'}
            </span>
            {person.roles.length > 0 && <span className="roles">{person.roles.join(', ')}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ArtistView({ artist }: { artist: ArtistProfile }) {
  return (
    <article className="artist">
      <header className="artist-hero">
        <div className="artist-photo">
          {artist.image && <HideOnError src={artist.image} alt={artist.name} width={320} height={320} />}
          <span className="artist-monogram" aria-hidden="true">
            {artist.name.charAt(0)}
          </span>
        </div>

        <div className="artist-intro">
          <p className="artist-kicker">
            {artist.type ?? 'Artist'}
            {artist.gender && ` · ${artist.gender}`}
          </p>
          <h1>{artist.name}</h1>
          {artist.disambiguation && <p className="artist-note">{artist.disambiguation}</p>}

          <dl className="artist-facts">
            {artist.origin && (
              <div>
                <dt>From</dt>
                <dd>{artist.origin}</dd>
              </div>
            )}
            {artist.active && (
              <div>
                <dt>{artist.ended ? 'Active' : 'Since'}</dt>
                <dd>{artist.active}</dd>
              </div>
            )}
            {artist.rating !== null && (
              <div>
                <dt>Rating</dt>
                <dd>
                  ★ {artist.rating} <span className="meta">({artist.ratingVotes} votes)</span>
                </dd>
              </div>
            )}
            <div>
              <dt>Releases</dt>
              <dd>{artist.releaseCount}</dd>
            </div>
          </dl>

          {artist.genres.length > 0 && (
            <ul className="chips" aria-label="Genres">
              {artist.genres.slice(0, 8).map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}

          {(artist.officialUrl || artist.quickLinks.length > 0) && (
            <ul className="artist-actions" aria-label="Listen">
              {artist.officialUrl && (
                <li>
                  <a className="pill pill-solid" href={artist.officialUrl} rel="noopener" target="_blank">
                    Official site
                  </a>
                </li>
              )}
              {artist.quickLinks.map((link) => (
                <li key={link.url}>
                  <a className="pill" href={link.url} rel="noopener" target="_blank">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {artist.members.length > 0 && (
        <section className="artist-section">
          <h2>Members</h2>
          <People people={artist.members} />
        </section>
      )}

      {artist.memberOf.length > 0 && (
        <section className="artist-section">
          <h2>Member of</h2>
          <People people={artist.memberOf} details={false} />
        </section>
      )}

      {artist.discography.length > 0 && (
        <section className="artist-section">
          <h2>Discography</h2>
          {artist.discography.map((section, i) => (
            <details className="releases" open={i === 0} key={section.label}>
              <summary>
                {section.label} <span className="meta">{section.total}</span>
              </summary>
              <ul className="covers">
                {section.releases.map((release) => (
                  <li key={release.mbid}>
                    <a href={`https://musicbrainz.org/release-group/${release.mbid}`} rel="noopener" target="_blank">
                      <span className="cover">
                        <HideOnError src={release.cover} alt="" width={250} height={250} loading="lazy" />
                        <span className="cover-fallback" aria-hidden="true">
                          ♪
                        </span>
                      </span>
                      <strong>{release.title}</strong>
                      <span className="meta">{release.year || 'Year unknown'}</span>
                    </a>
                  </li>
                ))}
              </ul>
              {section.total > section.releases.length && (
                <p className="meta">
                  Showing {section.releases.length} of {section.total}.{' '}
                  <a href={artist.musicbrainzUrl} rel="noopener" target="_blank">
                    See them all on MusicBrainz
                  </a>
                </p>
              )}
            </details>
          ))}
        </section>
      )}

      {artist.links.length > 0 && (
        <section className="artist-section">
          <h2>Links</h2>
          <div className="link-groups">
            {artist.links.map((group) => (
              <div key={group.label}>
                <h3>{group.label}</h3>
                <ul className="pills">
                  {group.items.map((link) => (
                    <li key={link.url}>
                      <a className="pill" href={link.url} rel="noopener" target="_blank" title={link.kind}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.entries(artist.related).map(([kind, people]) => (
        <section className="artist-section" key={kind}>
          <h2>{kind}</h2>
          <ul className="pills">
            {people.map((person) => (
              <li key={`${person.mbid}-${person.years}`}>
                <Link className="pill" href={`/artists/${person.mbid}`} prefetch={false}>
                  {person.name} {person.years && <span className="meta">{person.years}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="artist-section artist-details">
        {artist.aliases.length > 0 && (
          <div>
            <h2>Also known as</h2>
            <p>{artist.aliases.join(' · ')}</p>
          </div>
        )}
        {artist.tags.length > 0 && (
          <div>
            <h2>Tags</h2>
            <ul className="chips chips-quiet">
              {artist.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2>Identifiers</h2>
          <dl className="artist-ids">
            <div>
              <dt>MusicBrainz</dt>
              <dd>
                <a href={artist.musicbrainzUrl} rel="noopener" target="_blank">
                  {artist.mbid}
                </a>
              </dd>
            </div>
            {artist.isnis.map((isni) => (
              <div key={isni}>
                <dt>ISNI</dt>
                <dd>{isni}</dd>
              </div>
            ))}
            {artist.ipis.map((ipi) => (
              <div key={ipi}>
                <dt>IPI</dt>
                <dd>{ipi}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <p className="source">
        Data from MusicBrainz, saved {savedOn.format(new Date(artist.fetchedAt))}. Photo from Wikimedia Commons, covers
        from the Cover Art Archive.
      </p>
    </article>
  )
}
