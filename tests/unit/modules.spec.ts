import { describe, expect, it } from 'vitest'

import { type GoogleNewsClient, parseFeed } from '@/modules/news/GoogleNewsClient'
import { NewsModule } from '@/modules/news/NewsModule'
import type { OpenMeteoClient } from '@/modules/weather/OpenMeteoClient'
import { sky, WeatherModule } from '@/modules/weather/WeatherModule'

// Fakes stand in for the HTTP clients, so these tests run without the internet.
const fake = <T>(methods: Partial<T>) => methods as T

const down = () => Promise.reject(new Error('down'))

const weatherClient = fake<OpenMeteoClient>({
  findPlace: async (name) =>
    name === 'Nowhere'
      ? null
      : name === 'Chicago'
        ? { name, country: 'United States', country_code: 'US', latitude: 41.85, longitude: -87.65 }
        : { name, country: 'France', country_code: 'FR', latitude: 48.85, longitude: 2.35 },
  placeAt: async (latitude, longitude) =>
    latitude === 0
      ? null
      : { name: 'Chicago', country: 'United States', country_code: 'US', latitude, longitude },
  forecast: async (_latitude, _longitude, imperial) => ({
    current: {
      temperature_2m: imperial ? 48.6 : 9.2,
      apparent_temperature: 7,
      wind_speed_10m: imperial ? 7.5 : 12,
      weather_code: 3,
    },
    daily: {
      time: ['2026-10-24', '2026-10-25'],
      weather_code: [0, 61],
      temperature_2m_max: [14, 12],
      temperature_2m_min: [6, 5],
    },
  }),
})

describe('WeatherModule', () => {
  it('returns current weather and the forecast', async () => {
    const data = await new WeatherModule(weatherClient).load({ city: 'Paris' })
    if ('error' in data) throw new Error(data.error)
    expect(data.place.name).toBe('Paris')
    expect(data.current).toEqual({ temperature: 9.2, feelsLike: 7, wind: 12, label: 'Overcast', sky: 'cloudy' })
    expect(data).toMatchObject({ temperatureUnit: '°C', windUnit: 'km/h' })
    expect(data.days.map((day) => day.label)).toEqual(['Clear sky', 'Light rain'])
    expect(data.days.map((day) => day.sky)).toEqual(['clear', 'rain'])
  })

  it('groups weather codes into skies', () => {
    expect([0, 3, 45, 63, 75, 95].map(sky)).toEqual(['clear', 'cloudy', 'fog', 'rain', 'snow', 'storm'])
  })

  it('uses Fahrenheit and mph in the United States', async () => {
    const data = await new WeatherModule(weatherClient).load({ city: 'Chicago' })
    if ('error' in data) throw new Error(data.error)
    expect(data.current).toMatchObject({ temperature: 48.6, wind: 7.5 })
    expect(data).toMatchObject({ temperatureUnit: '°F', windUnit: 'mph' })
  })

  it('uses the visitor\'s location', async () => {
    const data = await new WeatherModule(weatherClient).load({ lat: '41.85', lon: '-87.65' })
    if ('error' in data) throw new Error(data.error)
    expect(data).toMatchObject({ city: 'Chicago', locate: false, temperatureUnit: '°F' })
    expect(data.place.name).toBe('Chicago')
  })

  it('prefers a searched city over the visitor\'s location', async () => {
    const data = await new WeatherModule(weatherClient).load({ city: 'Paris', lat: '41.85', lon: '-87.65' })
    expect(data).toMatchObject({ city: 'Paris', locate: false })
  })

  it('uses the default city for invalid coordinates', async () => {
    const data = await new WeatherModule(weatherClient).load({ lat: 'north', lon: '999' })
    expect(data).toMatchObject({ city: 'London', locate: true })
  })

  it('reports when no place is found at the visitor\'s location', async () => {
    const data = await new WeatherModule(weatherClient).load({ lat: '0', lon: '-30' })
    expect(data).toMatchObject({ error: expect.stringContaining('No town found') })
  })

  it('asks for a location only when no city is chosen', async () => {
    expect(await new WeatherModule(weatherClient).load({})).toMatchObject({ locate: true })
    expect(await new WeatherModule(weatherClient).load({ city: 'Paris' })).toMatchObject({ locate: false })
  })

  it('uses the default city when none is given', async () => {
    const data = await new WeatherModule(weatherClient).load({})
    expect(data.city).toBe('London')
  })

  it('reports an unknown city', async () => {
    const data = await new WeatherModule(weatherClient).load({ city: 'Nowhere' })
    expect(data).toMatchObject({ error: expect.stringContaining('No place found') })
  })

  it('reports when the service is down', async () => {
    const data = await new WeatherModule(fake<OpenMeteoClient>({ findPlace: down })).load({})
    expect(data).toMatchObject({ error: expect.stringContaining('did not respond') })
  })
})

describe('NewsModule', () => {
  const client = fake<GoogleNewsClient>({
    topStories: async () => [
      { title: 'Big story - BBC', link: 'https://example.com/big', source: 'BBC', published: 'Tue, 10 Nov 2026 01:38:49 GMT' },
      { title: 'No source', link: 'https://example.com/other', source: '', published: 'not a date' },
    ],
  })

  it('shows the source on its own line instead of in the headline', async () => {
    const data = await new NewsModule(client).load()
    if ('error' in data) throw new Error(data.error)
    expect(data.stories[0]).toMatchObject({ title: 'Big story', url: 'https://example.com/big', source: 'BBC', published: '2026-11-10T01:38:49.000Z' })
  })

  it('keeps a story without a source or date', async () => {
    const data = await new NewsModule(client).load()
    if ('error' in data) throw new Error(data.error)
    expect(data.stories[1]).toMatchObject({ title: 'No source', published: null })
  })

  it('reads the Google News feed', () => {
    const items = parseFeed(
      '<rss><channel><item><title>Ben &amp; Jerry&#39;s - NPR</title><link>https://news.google.com/a</link>' +
        '<pubDate>Tue, 10 Nov 2026 01:00:00 GMT</pubDate><source url="https://www.npr.org">NPR</source></item></channel></rss>',
    )
    expect(items).toEqual([{ title: "Ben & Jerry's - NPR", link: 'https://news.google.com/a', published: 'Tue, 10 Nov 2026 01:00:00 GMT', source: 'NPR' }])
    expect(() => parseFeed('not xml')).toThrow()
  })

  it('reports when the service is down', async () => {
    const data = await new NewsModule(fake<GoogleNewsClient>({ topStories: down })).load()
    expect(data).toMatchObject({ error: expect.stringContaining('did not respond') })
  })
})

