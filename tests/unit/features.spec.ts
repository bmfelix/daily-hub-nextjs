import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearCache, remember } from '@/lib/cache'
import { albumKey, bestMatch, MusicClient, sameArtist } from '@/lib/music/client'
import { compact, songKey } from '@/lib/musicbrainz/names'
import { connectState, playlistEmbeds, validState } from '@/lib/spotify'
import { WikipediaClient } from '@/lib/wikipedia'
import { fetchRepositories } from '@/modules/about/AboutModule'
import { parseCalendar } from '@/modules/agenda/CalendarClient'
import { BratModule } from '@/modules/brat/BratModule'
import { BuiltModule } from '@/modules/built/BuiltModule'
import { MODULE_SLUGS } from '@/modules/slugs'
import { countArtists, countSongs, mondayOf } from '@/modules/charts/ChartsModule'
import { concert } from '@/modules/concerts/TicketmasterClient'
import { IHeartStation, TritonStation } from '@/modules/radio/stations'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('names', () => {
  it('treats spellings and spacing as the same song', () => {
    expect(compact('3 AM!')).toBe('3am')
    expect(songKey('MATCHBOX 20', '3 AM')).toBe(songKey('Matchbox 20', '3AM'))
  })
})

describe('song matching', () => {
  const read = (item: [string, string]) => item

  it('allows for several artists on either side', () => {
    expect(sameArtist('Tame Impala [+] Jennie', 'Tame Impala')).toBe(true)
    expect(sameArtist("Guns N Roses", "Guns N' Roses")).toBe(true)
    expect(sameArtist('Pearl Jam', 'Metallica')).toBe(false)
    expect(sameArtist('Pearl Jam', '')).toBe(false)
  })

  it('prefers an exact title and accepts extra words', () => {
    const items: [string, string][] = [['U2', 'One (Live)'], ['U2', 'One']]
    expect(bestMatch(items, 'U2', 'One', read)).toEqual(['U2', 'One'])
    expect(bestMatch([items[0]], 'U2', 'One', read)).toEqual(items[0])
  })

  it('rejects another artist', () => {
    expect(bestMatch([['Tribute Act', 'One']] as [string, string][], 'U2', 'One', read)).toBeNull()
  })

  it('reduces album titles', () => {
    expect(albumKey('Ten (Remastered)')).toBe('ten')
    expect(albumKey('Alive - Single')).toBe('alive')
    expect(albumKey('Mad Season')).toBe('mad season')
  })
})

describe('MusicClient', () => {
  it('keeps only this artist and asks for larger artwork', async () => {
    vi.stubGlobal('fetch', async () =>
      json({
        results: [
          { artistName: 'Pearl Jam', collectionName: 'Ten', artworkUrl100: 'https://a/100x100bb.jpg', collectionViewUrl: 'https://music.apple.com/ten' },
          { artistName: 'Pearl Jam Tribute', collectionName: 'Covers', artworkUrl100: 'https://b/100x100bb.jpg' },
        ],
      }),
    )
    expect(await new MusicClient().appleAlbums('Pearl Jam')).toEqual({
      ten: { artwork: 'https://a/250x250bb.jpg', url: 'https://music.apple.com/ten' },
    })
  })
})

describe('WikipediaClient', () => {
  const page = { title: 'Pearl Jam', fullurl: 'https://en.wikipedia.org/wiki/Pearl_Jam', extract: 'A rock band.', description: 'American rock band' }

  it('follows the Wikidata link', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      url.includes('wikidata') ? json({ entities: { Q1: { sitelinks: { enwiki: { title: 'Pearl Jam' } } } } }) : json({ query: { pages: [page] } }),
    )
    const found = await new WikipediaClient().find({ name: 'Pearl Jam', relations: [{ url: { resource: 'https://www.wikidata.org/wiki/Q1' } }] })
    expect(found?.summary).toBe('A rock band.')
  })

  it('reads a direct link', async () => {
    const record = { name: 'X', relations: [{ url: { resource: 'https://en.wikipedia.org/wiki/Guns_N%27_Roses' } }] }
    expect(await new WikipediaClient().linkedTitle(record)).toBe("Guns N' Roses")
  })

  it('requires a page found by name to be about music', async () => {
    vi.stubGlobal('fetch', async () => json({ query: { pages: [{ title: 'Apple', fullurl: 'u', extract: 'A fruit.', description: 'Edible fruit' }] } }))
    expect(await new WikipediaClient().find({ name: 'Apple', relations: [] })).toBeNull()
  })

  it('skips disambiguation pages', async () => {
    vi.stubGlobal('fetch', async () => json({ query: { pages: [{ ...page, pageprops: { disambiguation: '' } }] } }))
    expect(await new WikipediaClient().page('Bush')).toBeNull()
  })
})

describe('Spotify helpers', () => {
  it('reads several playlists', () => {
    vi.stubEnv('SPOTIFY_PLAYLIST_URL', 'https://open.spotify.com/playlist/aaa?si=1,https://open.spotify.com/playlist/bbb?si=2')
    expect(playlistEmbeds()).toEqual([
      'https://open.spotify.com/embed/playlist/aaa?theme=0',
      'https://open.spotify.com/embed/playlist/bbb?theme=0',
    ])
  })

  it('has no playlists without a link', () => {
    vi.stubEnv('SPOTIFY_PLAYLIST_URL', 'https://example.com/nothing')
    expect(playlistEmbeds()).toEqual([])
  })

  it('accepts its own recent state and rejects forged or old ones', () => {
    vi.stubEnv('PAYLOAD_SECRET', 'secret')
    expect(validState(connectState())).toBe(true)
    expect(validState('forged')).toBe(false)
    expect(validState(`${Date.now()}.abcdef`)).toBe(false)
    expect(validState(connectState(Date.now() - 60 * 60 * 1000))).toBe(false)
  })
})

describe('calendars', () => {
  it('expands all-day and repeating events', () => {
    const start = new Date(Date.UTC(2026, 10, 10))
    const end = new Date(Date.UTC(2026, 10, 20))
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//EN',
      'BEGIN:VEVENT', 'UID:1', 'DTSTAMP:20260101T000000Z', 'DTSTART;VALUE=DATE:20261112', 'SUMMARY:Holiday', 'END:VEVENT',
      'BEGIN:VEVENT', 'UID:2', 'DTSTAMP:20260101T000000Z', 'DTSTART:20261111T150000Z', 'DTEND:20261111T160000Z',
      'RRULE:FREQ=DAILY;COUNT=3', 'SUMMARY:Standup', 'LOCATION:Kitchen', 'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const items = parseCalendar(ics, start, end)
    expect(items.filter((item) => item.title === 'Standup')).toHaveLength(3)
    expect(items.find((item) => item.title === 'Holiday')).toMatchObject({ allDay: true, day: '2026-11-12' })
    expect(items.find((item) => item.title === 'Standup')).toMatchObject({ day: '2026-11-11', location: 'Kitchen', allDay: false })
  })
})

describe('concerts', () => {
  it('picks a useful image size', () => {
    const show = concert(
      {
        name: 'Pearl Jam',
        url: 'https://www.ticketmaster.com/e/1',
        dates: { start: { localDate: '2026-12-01', localTime: '19:30:00' } },
        images: [{ url: 'small', width: 100 }, { url: 'big', width: 640 }],
        _embedded: { venues: [{ name: 'Heritage Bank Center' }] },
      },
      'Cincinnati',
    )
    expect(show).toMatchObject({ date: '2026-12-01', venue: 'Heritage Bank Center', city: 'Cincinnati', image: 'big' })
  })
})

describe('charts', () => {
  it('counts different spellings as one song', () => {
    const plays = [
      { songKey: songKey('Nirvana', 'Lithium'), title: 'Lithium', artistName: 'Nirvana' },
      { songKey: songKey('NIRVANA', 'LITHIUM'), title: 'LITHIUM', artistName: 'NIRVANA' },
      { songKey: songKey('Metallica', 'One'), title: 'One', artistName: 'Metallica' },
    ]
    expect(countSongs(plays).map((row) => row.plays)).toEqual([2, 1])
    expect(countArtists(plays)).toHaveLength(3)
  })

  it('starts weeks on Monday', () => {
    expect(mondayOf(new Date('2026-11-08T20:00:00Z')).toISOString().slice(0, 10)).toBe('2026-11-02')
    expect(mondayOf(new Date('2026-11-02T01:00:00Z')).toISOString().slice(0, 10)).toBe('2026-11-02')
  })
})

describe('live streams', () => {
  it('gives each station its audio address', () => {
    expect(new IHeartStation('A', '1', 1701).streamUrl).toBe('https://stream.revma.ihrhls.com/zc1701')
    expect(new TritonStation('B', '2', 'WKRQFM').streamUrl).toContain('WKRQFM.mp3')
  })
})

describe('about', () => {
  it('skips forks', async () => {
    vi.stubGlobal('fetch', async () =>
      json([
        { name: 'mine', html_url: 'https://github.com/x/mine', description: 'My repo', language: 'TypeScript' },
        { name: 'forked', html_url: 'https://github.com/x/forked', fork: true },
      ]),
    )
    expect((await fetchRepositories('x')).map((repo) => repo.name)).toEqual(['mine'])
  })
})

describe('How it is built', () => {
  it('uses the address set for each build', async () => {
    vi.stubEnv('NEXTJS_SITE_URL', 'https://two.test')
    vi.stubEnv('LARAVEL_SITE_URL', '')
    const { sites } = await new BuiltModule().load()
    expect(sites['Next.js']).toBe('https://two.test')
    expect(sites.Laravel).toBe('')
  })
})

describe('BRAT', () => {
  it('has its own page and menu link, but no homepage card', () => {
    const brat = new BratModule()
    expect(brat.inMenu).toBe(true)
    expect(brat.onHome).toBe(false)
    expect(MODULE_SLUGS).toContain('brat')
  })
})

describe('cache', () => {
  beforeEach(clearCache)

  it('keeps a result for a while', async () => {
    const load = vi.fn(async () => 'value')
    await remember('key', 60, load)
    await remember('key', 60, load)
    expect(load).toHaveBeenCalledTimes(1)
  })
})
