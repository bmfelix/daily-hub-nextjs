// Turning a saved artist record into what the artist page shows.

import type { Artist } from '@/payload-types'

import type { ReleaseGroup } from './client'

type Named = { name: string }
type Relation = {
  'target-type'?: string
  type: string
  direction?: string
  begin?: string | null
  end?: string | null
  ended?: boolean
  attributes?: string[]
  url?: { resource: string }
  artist?: { id: string; name: string }
}
type Record_ = {
  name: string
  type?: string | null
  gender?: string | null
  disambiguation?: string
  area?: Named | null
  'begin-area'?: Named | null
  'life-span'?: { begin?: string | null; end?: string | null; ended?: boolean }
  aliases?: Named[]
  genres?: (Named & { count: number })[]
  tags?: (Named & { count: number })[]
  rating?: { value?: number | null; 'votes-count'?: number }
  relations?: Relation[]
  isnis?: string[]
  ipis?: string[]
}

export type Link = { url: string; label: string; kind: string }
export type Person = { name: string; mbid: string; years: string; roles: string[]; original: boolean; current: boolean }
export type Release = { title: string; year: string; mbid: string; cover: string }

const LINK_GROUPS: [string, Set<string>][] = [
  ['Listen', new Set(['free streaming', 'streaming', 'youtube music', 'soundcloud', 'bandcamp'])],
  ['Official', new Set(['official homepage', 'blog'])],
  ['Social', new Set(['social network', 'youtube', 'myspace', 'fanpage', 'online community', 'video channel'])],
  ['Concerts', new Set(['setlistfm', 'songkick', 'bandsintown', 'ticketing'])],
  ['Buy', new Set(['purchase for download', 'purchase for mail-order'])],
  ['Reference', new Set(['wikidata', 'wikipedia', 'allmusic', 'discogs', 'last.fm', 'IMDb', 'BBC Music page', 'lyrics',
    'secondhandsongs', 'VIAF', 'other databases', 'discography page', 'purevolume'])],
]

const SITE_NAMES: Record<string, string> = {
  'open.spotify.com': 'Spotify', 'music.apple.com': 'Apple Music', 'itunes.apple.com': 'iTunes',
  'music.youtube.com': 'YouTube Music', 'youtube.com': 'YouTube', 'soundcloud.com': 'SoundCloud',
  'deezer.com': 'Deezer', 'tidal.com': 'Tidal', 'music.amazon.com': 'Amazon Music', 'napster.com': 'Napster',
  'bandcamp.com': 'Bandcamp', 'facebook.com': 'Facebook', 'instagram.com': 'Instagram', 'twitter.com': 'Twitter',
  'x.com': 'X', 'tiktok.com': 'TikTok', 'wikidata.org': 'Wikidata', 'wikipedia.org': 'Wikipedia',
  'allmusic.com': 'AllMusic', 'discogs.com': 'Discogs', 'last.fm': 'Last.fm', 'imdb.com': 'IMDb',
  'bbc.co.uk': 'BBC Music', 'genius.com': 'Genius', 'setlist.fm': 'Setlist.fm', 'songkick.com': 'Songkick',
  'bandsintown.com': 'Bandsintown', 'ticketmaster.com': 'Ticketmaster', 'secondhandsongs.com': 'SecondHandSongs',
  'viaf.org': 'VIAF', 'myspace.com': 'Myspace', 'play.google.com': 'Google Play',
}

const RELEASE_SECTIONS = ['Albums', 'EPs', 'Singles', 'Live', 'Compilations', 'Other'] as const
const CAREER_ORDER = new Set(['Albums', 'EPs']) // oldest first; the other sections show newest first
const SHOW_PER_SECTION = 60

export function siteName(url: string): string {
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
  for (const [domain, label] of Object.entries(SITE_NAMES)) {
    if (host === domain || host.endsWith(`.${domain}`)) return label
  }
  return host
}

/** A direct image address for a Wikimedia Commons file page. */
export function commonsImage(url: string): string | null {
  const match = url.match(/commons\.wikimedia\.org\/wiki\/File:(.+)$/)
  return match ? `https://commons.wikimedia.org/wiki/Special:FilePath/${match[1]}?width=640` : null
}

const year = (date?: string | null) => (date ?? '').slice(0, 4)
const span = (begin: string, end: string) => [begin, end].filter(Boolean).join('–')

function releaseSection(group: ReleaseGroup): (typeof RELEASE_SECTIONS)[number] {
  const secondary = group['secondary-types'] ?? []
  if (secondary.includes('Live')) return 'Live'
  if (secondary.includes('Compilation')) return 'Compilations'
  if (secondary.length) return 'Other'
  return ({ Album: 'Albums', EP: 'EPs', Single: 'Singles' } as const)[group['primary-type'] as 'Album' | 'EP' | 'Single'] ?? 'Other'
}

/** MusicBrainz lists one entry per role or period; show each person once. */
function mergePerson(people: Person[], person: Person) {
  const existing = people.find((p) => p.mbid === person.mbid)
  if (!existing) {
    people.push(person)
    return
  }
  existing.roles.push(...person.roles.filter((role) => !existing.roles.includes(role)))
  if (!existing.years.split(', ').includes(person.years)) existing.years += `, ${person.years}`
  existing.original ||= person.original
  existing.current ||= person.current
}

export function artistProfile(artist: Artist) {
  const data = artist.data as unknown as Record_
  const life = data['life-span'] ?? {}

  const links: Record<string, Link[]> = {}
  const related: Record<string, Person[]> = {}
  const members: Person[] = []
  const memberOf: Person[] = []
  let image: string | null = null

  for (const rel of data.relations ?? []) {
    if (rel['target-type'] === 'url' && rel.url) {
      const url = rel.url.resource
      if (rel.type === 'image') {
        image ??= commonsImage(url)
        continue
      }
      const group = LINK_GROUPS.find(([, types]) => types.has(rel.type))?.[0] ?? 'Reference'
      ;(links[group] ??= []).push({ url, label: siteName(url), kind: rel.type })
    } else if (rel['target-type'] === 'artist' && rel.artist) {
      const attributes = rel.attributes ?? []
      const person: Person = {
        name: rel.artist.name,
        mbid: rel.artist.id,
        years: span(year(rel.begin), year(rel.end) || (rel.ended ? '' : 'now')),
        roles: attributes.filter((a) => a !== 'original'),
        original: attributes.includes('original'),
        current: !rel.ended,
      }
      if (rel.type === 'member of band') mergePerson(rel.direction === 'backward' ? members : memberOf, person)
      else (related[rel.type.charAt(0).toUpperCase() + rel.type.slice(1)] ??= []).push(person)
    }
  }
  for (const group of Object.values(links)) {
    // The same address can be listed under two kinds.
    const unique = [...new Map(group.map((link) => [link.url, link])).values()]
    group.splice(0, group.length, ...unique)
  }

  const sections = new Map<string, Release[]>(RELEASE_SECTIONS.map((label) => [label, []]))
  const releaseGroups = artist.releaseGroups as unknown as ReleaseGroup[]
  for (const group of releaseGroups) {
    sections.get(releaseSection(group))!.push({
      title: group.title,
      year: year(group['first-release-date']),
      mbid: group.id,
      cover: `https://coverartarchive.org/release-group/${group.id}/front-250`,
    })
  }
  const discography = [...sections]
    .filter(([, items]) => items.length)
    .map(([label, items]) => {
      if (CAREER_ORDER.has(label)) items.sort((a, b) => (a.year || '9999').localeCompare(b.year || '9999'))
      else items.sort((a, b) => (b.year || '0000').localeCompare(a.year || '0000'))
      return { label, total: items.length, releases: items.slice(0, SHOW_PER_SECTION) }
    })

  const genres = [...(data.genres ?? [])].sort((a, b) => b.count - a.count).map((g) => g.name)
  const tags = [...(data.tags ?? [])].sort((a, b) => b.count - a.count).map((t) => t.name).filter((t) => !genres.includes(t))

  return {
    name: data.name,
    mbid: artist.mbid,
    disambiguation: data.disambiguation || null,
    type: data.type ?? null,
    gender: data.gender ?? null,
    origin: [data['begin-area']?.name, data.area?.name].filter(Boolean).join(', '),
    active: span(year(life.begin), year(life.end) || (life.ended ? '' : 'present')),
    ended: Boolean(life.ended),
    rating: data.rating?.value ?? null,
    ratingVotes: data.rating?.['votes-count'] ?? 0,
    genres,
    tags: tags.slice(0, 12),
    aliases: [...new Set((data.aliases ?? []).map((a) => a.name).filter((n) => n !== data.name))].sort(),
    image,
    members: members.sort((a, b) => Number(!a.current) - Number(!b.current) || a.years.localeCompare(b.years)),
    memberOf,
    related,
    discography,
    releaseCount: releaseGroups.length,
    links: LINK_GROUPS.filter(([label]) => links[label]).map(([label]) => ({ label, items: links[label] })),
    // The header buttons: each listening site once, then the official site.
    quickLinks: [...new Map((links.Listen ?? []).map((link) => [link.label, link])).values()].slice(0, 4),
    officialUrl: (links.Official ?? []).find((link) => link.kind === 'official homepage')?.url ?? null,
    isnis: data.isnis ?? [],
    ipis: data.ipis ?? [],
    musicbrainzUrl: `https://musicbrainz.org/artist/${artist.mbid}`,
    fetchedAt: artist.fetchedAt,
  }
}

export type ArtistProfile = ReturnType<typeof artistProfile>
