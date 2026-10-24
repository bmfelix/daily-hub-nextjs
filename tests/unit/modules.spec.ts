import { describe, expect, it } from 'vitest'

import { CurrencyModule } from '@/modules/currency/CurrencyModule'
import type { FrankfurterClient } from '@/modules/currency/FrankfurterClient'
import type { HackerNewsClient } from '@/modules/news/HackerNewsClient'
import { NewsModule } from '@/modules/news/NewsModule'
import type { OpenMeteoClient } from '@/modules/weather/OpenMeteoClient'
import { WeatherModule } from '@/modules/weather/WeatherModule'

// Fakes stand in for the HTTP clients, so these tests run without the internet.
const fake = <T>(methods: Partial<T>) => methods as T

const down = () => Promise.reject(new Error('down'))

const weatherClient = fake<OpenMeteoClient>({
  findPlace: async (name) =>
    name === 'Nowhere' ? null : { name, country: 'France', latitude: 48.85, longitude: 2.35 },
  forecast: async () => ({
    current: { temperature_2m: 9.2, apparent_temperature: 7, wind_speed_10m: 12, weather_code: 3 },
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
    expect(data.current).toEqual({ temperature: 9.2, feelsLike: 7, wind: 12, label: 'Overcast' })
    expect(data.days.map((day) => day.label)).toEqual(['Clear sky', 'Light rain'])
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
  const client = fake<HackerNewsClient>({
    frontPage: async () => [
      { objectID: '1', title: 'With link', url: 'https://example.com', points: 10, num_comments: 3, author: 'ann' },
      { objectID: '2', title: 'Ask HN', url: null, points: null, num_comments: null, author: 'bob' },
    ],
  })

  it('maps stories', async () => {
    const data = await new NewsModule(client).load()
    if ('error' in data) throw new Error(data.error)
    expect(data.stories[0]).toMatchObject({ title: 'With link', url: 'https://example.com', comments: 3 })
  })

  it('links a story without a URL to its discussion', async () => {
    const data = await new NewsModule(client).load()
    if ('error' in data) throw new Error(data.error)
    expect(data.stories[1]).toMatchObject({ url: 'https://news.ycombinator.com/item?id=2', points: 0, comments: 0 })
  })

  it('reports when the service is down', async () => {
    const data = await new NewsModule(fake<HackerNewsClient>({ frontPage: down })).load()
    expect(data).toMatchObject({ error: expect.stringContaining('did not respond') })
  })
})

describe('CurrencyModule', () => {
  const client = fake<FrankfurterClient>({
    currencies: async () => ({ USD: 'United States Dollar', EUR: 'Euro' }),
    convert: async (amount) => ({ rate: 0.9, result: amount * 0.9, date: '2026-10-23' }),
  })
  const load = (params: Record<string, string>, c = client) => new CurrencyModule(c).load(params)

  it('converts', async () => {
    const data = await load({ amount: '100', from: 'USD', to: 'EUR' })
    expect(data.conversion?.result).toBeCloseTo(90)
  })

  it('needs no API call for the same currency', async () => {
    const data = await load({ amount: '5', from: 'EUR', to: 'EUR' })
    expect(data.conversion).toEqual({ rate: 1, result: 5, date: null })
  })

  it('rejects a bad amount', async () => {
    const data = await load({ amount: 'abc', from: 'USD', to: 'EUR' })
    expect(data.error).toContain('Enter a number')
  })

  it('rejects an unknown currency', async () => {
    const data = await load({ amount: '1', from: 'USD', to: 'XXX' })
    expect(data.error).toContain('Choose currencies from the list')
  })

  it('reports when the service is down', async () => {
    const data = await load({}, fake<FrankfurterClient>({ currencies: down }))
    expect(data.error).toContain('did not respond')
  })
})
