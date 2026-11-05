// Saved songs and plays for the radio. Server only: the listener must not import this.

import type { Payload } from 'payload'

import { hasPreview, SongLibrary } from '@/lib/music/library'
import { songKey } from '@/lib/musicbrainz/names'
import { getPayloadClient } from '@/lib/payload'
import type { Song } from '@/payload-types'

import { defaultStations, type RadioData, stationData, type TrackSong } from './data'
import type { Station } from './stations'

const SONGS_PER_SYNC = 3 // Apple allows about 20 requests a minute

export function trackSong(song: Song): TrackSong {
  return {
    id: song.id,
    hasPreview: hasPreview(song),
    artworkUrl: song.artworkUrl ?? '',
    appleUrl: song.appleUrl ?? '',
    deezerUrl: song.deezerUrl ?? '',
    title: song.title,
    artistName: song.artistName,
  }
}

/** Add each track's saved previews. The listener looks songs up, so pages stay fast. */
export async function withSavedSongs(data: RadioData): Promise<RadioData> {
  const keys = data.stations.flatMap((station) => (station.tracks ?? []).map((track) => songKey(track.artist, track.title)))
  if (!keys.length) return data
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'songs', where: { key: { in: keys } }, pagination: false, depth: 0 })
  const songs = new Map(docs.map((song) => [song.key, song]))
  return {
    stations: data.stations.map((station) => ({
      ...station,
      tracks: station.tracks?.map((track) => {
        const song = songs.get(songKey(track.artist, track.title))
        return { ...track, song: song ? trackSong(song) : null }
      }),
    })),
  }
}

/**
 * Save every recent play for the charts, then look up a few songs. Returns how
 * many were looked up and how many are still waiting.
 */
export async function syncRadio(
  payload: Payload,
  stations: Station[] = defaultStations(),
  library = new SongLibrary(payload),
): Promise<{ looked: number; waiting: number }> {
  const { stations: results } = await stationData(stations, 10)
  const heard: [string, string][] = []
  for (const station of results) {
    for (const track of station.tracks ?? []) {
      if (!track.artist || !track.title) continue
      heard.push([track.artist, track.title])
      const playedAt = new Date(track.start * 1000).toISOString()
      const { totalDocs } = await payload.count({
        collection: 'plays',
        where: { and: [{ station: { equals: station.name } }, { playedAt: { equals: playedAt } }] },
      })
      if (!totalDocs) {
        await payload.create({
          collection: 'plays',
          data: { station: station.name, artistName: track.artist, title: track.title, songKey: songKey(track.artist, track.title), playedAt },
        })
      }
    }
  }

  const waiting: [string, string][] = []
  for (const [artist, title] of new Map(heard.map((pair) => [songKey(...pair), pair])).values()) {
    if (await library.needsLookup(artist, title)) waiting.push([artist, title])
  }
  let looked = 0
  for (const [artist, title] of waiting.slice(0, SONGS_PER_SYNC)) {
    await library.find(artist, title).catch(() => null) // tried again on the next sync
    looked += 1
  }
  return { looked, waiting: waiting.length - looked }
}
