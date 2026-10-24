import { afterEach, describe, expect, it, vi } from 'vitest'

import { RadioListener } from '@/modules/radio/data'
import { RadioModule } from '@/modules/radio/RadioModule'
import { IHeartStation, Station, type Track, TritonStation } from '@/modules/radio/stations'

const TRITON_XML = `<?xml version="1.0" encoding="UTF-8"?><nowplaying-info-list>
<nowplaying-info type="track"><property name="cue_time_start"><![CDATA[2000000000000]]></property><property name="cue_time_duration"><![CDATA[200000]]></property><property name="cue_title"><![CDATA[Animal ]]></property><property name="track_artist_name"><![CDATA[Katseye]]></property><property name="track_id"><![CDATA[2]]></property></nowplaying-info>
<nowplaying-info type="track"><property name="cue_time_start"><![CDATA[1000000300000]]></property><property name="cue_time_duration"><![CDATA[200000]]></property><property name="cue_title"><![CDATA[Umbrella]]></property><property name="track_artist_name"><![CDATA[Rihanna]]></property><property name="track_id"><![CDATA[1]]></property></nowplaying-info>
<nowplaying-info type="track"><property name="cue_time_start"><![CDATA[1000000000000]]></property><property name="cue_time_duration"><![CDATA[200000]]></property><property name="cue_title"><![CDATA[Umbrella]]></property><property name="track_artist_name"><![CDATA[Rihanna]]></property><property name="track_id"><![CDATA[1]]></property></nowplaying-info>
</nowplaying-info-list>`

/** Replace fetch with one that returns this body. */
function fakeFetch(body: string | object) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(text, { status: 200 })))
}

afterEach(() => vi.unstubAllGlobals())

class FakeStation extends Station {
  constructor(
    name: string,
    private songs: Omit<Track, 'playing'>[] = [],
    private fail = false,
  ) {
    super(name, '1 FM')
  }

  protected async tracks(limit: number) {
    if (this.fail) throw new Error('down')
    return this.songs.slice(0, limit)
  }
}

const song = (title: string, end: number) => ({ title, artist: 'A', image: '', start: 0, end })
const FUTURE = 9999999999

describe('IHeartStation', () => {
  it('maps history and uses https images', async () => {
    fakeFetch({ data: [{ title: 'Self Esteem', artist: 'The Offspring', startTime: 100, endTime: FUTURE, imagePath: 'http://image.iheart.com/a.jpg' }] })
    const [track] = await new IHeartStation('WEBN', '102.7 FM', 1701).recent()
    expect(track).toMatchObject({ title: 'Self Esteem', image: 'https://image.iheart.com/a.jpg', playing: true })
  })
})

describe('TritonStation', () => {
  it('merges repeated cues and strips titles', async () => {
    fakeFetch(TRITON_XML)
    const tracks = await new TritonStation('WKRQ', '101.9 FM', 'WKRQFM').recent()
    expect(tracks.map((track) => track.title)).toEqual(['Animal', 'Umbrella'])
    // The repeated Umbrella cue keeps the earlier start time.
    expect(tracks[1]).toMatchObject({ start: 1000000000, playing: false })
  })
})

describe('Station.recent', () => {
  it('marks only the newest unfinished song as playing', async () => {
    const tracks = await new FakeStation('X', [song('New', FUTURE), song('Old', FUTURE)]).recent()
    expect(tracks.map((track) => track.playing)).toEqual([true, false])
  })

  it('treats a finished newest song as last played', async () => {
    const [track] = await new FakeStation('X', [song('Done', 0)]).recent()
    expect(track.playing).toBe(false)
  })
})

describe('RadioModule', () => {
  const radio = new RadioModule([
    new FakeStation('WEBN', [song('Self Esteem', FUTURE), song('Simple Man', 0)]),
    new FakeStation('WKRQ', [], true),
  ])

  it('gives the card one song per station and reports a failed station', async () => {
    const data = await radio.card()
    expect(data.stations[0].tracks?.map((track) => track.title)).toEqual(['Self Esteem'])
    expect(data.stations[1]).toEqual({ name: 'WKRQ', frequency: '1 FM', error: 'Song information is not available right now.' })
  })

  it('gives the page the recent songs', async () => {
    const data = await radio.load()
    expect(data.stations[0].tracks).toHaveLength(2)
  })
})

describe('RadioListener', () => {
  it('announces only when a song changes or ends', async () => {
    const announced: string[] = []
    const station = new FakeStation('WEBN', [song('Self Esteem', FUTURE)])
    const listener = new RadioListener(async (data) => {
      announced.push(data.stations[0].tracks?.[0]?.title ?? '')
    }, [station])

    expect(await listener.check()).toBe(true) // first check always announces
    expect(await listener.check()).toBe(false) // same song: nothing to send

    Object.assign(station, { songs: [song('Self Esteem', 0)] }) // same song, now finished
    expect(await listener.check()).toBe(true)

    Object.assign(station, { songs: [song('Simple Man', FUTURE)] })
    expect(await listener.check()).toBe(true)

    expect(announced).toEqual(['Self Esteem', 'Self Esteem', 'Simple Man'])
  })

  it('retries after a failed announcement', async () => {
    let calls = 0
    const listener = new RadioListener(async () => {
      if (++calls === 1) throw new Error('database is down')
    }, [new FakeStation('WEBN', [song('Self Esteem', FUTURE)])])

    await expect(listener.check()).rejects.toThrow('database is down')
    expect(await listener.check()).toBe(true) // same song, sent again
    expect(calls).toBe(2)
  })

  it('strips trailing asterisks from Triton titles', async () => {
    fakeFetch(TRITON_XML.replace('Animal ', 'Animal** '))
    const [track] = await new TritonStation('WKRQ', '101.9 FM', 'WKRQFM').recent()
    expect(track.title).toBe('Animal')
  })
})
