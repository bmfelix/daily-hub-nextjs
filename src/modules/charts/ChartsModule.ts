import { getPayloadClient } from '@/lib/payload'
import type { Play, Song } from '@/payload-types'

import { HubModule, param, type SearchParams } from '../HubModule'
import { ChartsCard } from './ChartsCard'
import { ChartsView } from './ChartsView'

const CHART_SIZE = 10
const WEEK = 7 * 24 * 60 * 60 * 1000

export type SongRow = { title: string; artist: string; plays: number; bar: number; song: Song | null }
export type ArtistRow = { artist: string; plays: number; bar: number }
export type ChartsData = {
  monday: string
  sunday: string
  previousWeek: string | null
  nextWeek: string | null
  total: number
  stations: { name: string; songs: SongRow[]; artists: ArtistRow[] }[]
}
export type ChartsCardData = { songs: SongRow[]; total: number }

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/** Midnight UTC on the Monday of that date's week. */
export function mondayOf(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
  return day
}

/** Add how long each row's bar is, compared to the top of the chart. */
function withBars<T extends { plays: number }>(rows: T[]): (T & { bar: number })[] {
  const top = rows[0]?.plays ?? 1
  return rows.map((row) => ({ ...row, bar: Math.round((row.plays / top) * 100) }))
}

/** Count plays by song, treating different spellings as one. */
export function countSongs(plays: Pick<Play, 'songKey' | 'title' | 'artistName'>[]) {
  const rows = new Map<string, { key: string; title: string; artist: string; plays: number }>()
  for (const play of plays) {
    const row = rows.get(play.songKey) ?? { key: play.songKey, title: play.title, artist: play.artistName, plays: 0 }
    row.plays += 1
    rows.set(play.songKey, row)
  }
  return [...rows.values()].sort((a, b) => b.plays - a.plays || a.title.localeCompare(b.title))
}

export function countArtists(plays: Pick<Play, 'artistName'>[]) {
  const rows = new Map<string, number>()
  for (const play of plays) rows.set(play.artistName, (rows.get(play.artistName) ?? 0) + 1)
  return [...rows]
    .map(([artist, count]) => ({ artist, plays: count }))
    .sort((a, b) => b.plays - a.plays || a.artist.localeCompare(b.artist))
}

export class ChartsModule extends HubModule<ChartsData, ChartsCardData> {
  readonly slug = 'charts'
  readonly title = 'Charts'
  readonly summary = 'The most-played songs and artists on Cincinnati radio, week by week.'
  readonly View = ChartsView
  readonly Card = ChartsCard

  private async weekPlays(monday: Date) {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plays',
      where: {
        and: [
          { playedAt: { greater_than_equal: monday.toISOString() } },
          { playedAt: { less_than: new Date(monday.getTime() + WEEK).toISOString() } },
        ],
      },
      pagination: false,
      depth: 0,
    })
    return docs
  }

  private async topSongs(plays: Play[], limit = CHART_SIZE): Promise<SongRow[]> {
    const rows = countSongs(plays).slice(0, limit)
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'songs',
      where: { key: { in: rows.map((row) => row.key) } },
      pagination: false,
      depth: 0,
    })
    return withBars(rows.map(({ key, ...row }) => ({ ...row, song: docs.find((song) => song.key === key) ?? null })))
  }

  async card(): Promise<ChartsCardData> {
    const plays = await this.weekPlays(mondayOf(new Date()))
    return { songs: await this.topSongs(plays, 3), total: plays.length }
  }

  async load(params: SearchParams): Promise<ChartsData> {
    const week = param(params, 'week')
    const asked = new Date(`${week}T00:00:00Z`)
    const thisWeek = mondayOf(new Date())
    const monday = /^\d{4}-\d{2}-\d{2}$/.test(week) && !Number.isNaN(asked.getTime()) ? mondayOf(asked) : thisWeek

    const plays = await this.weekPlays(monday)
    const payload = await getPayloadClient()
    const { docs: first } = await payload.find({ collection: 'plays', sort: 'playedAt', limit: 1, depth: 0 })
    const names = [...new Set(plays.map((play) => play.station))].sort()

    return {
      monday: isoDay(monday),
      sunday: isoDay(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)),
      previousWeek: first[0] && monday.getTime() > new Date(first[0].playedAt).getTime() ? isoDay(new Date(monday.getTime() - WEEK)) : null,
      nextWeek: monday < thisWeek ? isoDay(new Date(monday.getTime() + WEEK)) : null,
      total: plays.length,
      stations: await Promise.all(
        names.map(async (name) => {
          const stationPlays = plays.filter((play) => play.station === name)
          return {
            name,
            songs: await this.topSongs(stationPlays),
            artists: withBars(countArtists(stationPlays).slice(0, CHART_SIZE)),
          }
        }),
      ),
    }
  }
}
