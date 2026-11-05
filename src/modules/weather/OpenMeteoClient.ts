const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse'
const USER_AGENT = 'DailyHub/1.0'

export type Place = {
  name: string
  country?: string
  country_code?: string
  latitude: number
  longitude: number
}

type ReverseResult = { name?: string; address?: Record<string, string | undefined> }

export type Forecast = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

/** Talks to Open-Meteo, a free weather API that needs no key, and Nominatim for place names. */
export class OpenMeteoClient {
  timeout = 8000

  async findPlace(name: string): Promise<Place | null> {
    const url = `${GEOCODE_URL}?${new URLSearchParams({ name, count: '1' })}`
    const data = await this.getJson<{ results?: Place[] }>(url)
    return data.results?.[0] ?? null
  }

  /** Name the place at these coordinates. Open-Meteo cannot do this, so Nominatim does. */
  async placeAt(latitude: number, longitude: number): Promise<Place | null> {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      zoom: '10',
      'accept-language': 'en',
    })
    const data = await this.getJson<ReverseResult>(`${REVERSE_GEOCODE_URL}?${query}`, {
      'User-Agent': USER_AGENT,
    })
    const { address } = data
    if (!address) return null
    const name =
      address.city ?? address.town ?? address.village ?? address.hamlet ??
      address.municipality ?? address.county ?? address.state ?? data.name ?? ''
    return {
      name,
      country: address.country,
      country_code: address.country_code?.toUpperCase(),
      latitude,
      longitude,
    }
  }

  async forecast(latitude: number, longitude: number, imperial = false): Promise<Forecast> {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '5',
      temperature_unit: imperial ? 'fahrenheit' : 'celsius',
      wind_speed_unit: imperial ? 'mph' : 'kmh',
    })
    return this.getJson<Forecast>(`${FORECAST_URL}?${query}`)
  }

  private async getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      cache: 'no-store',
      headers,
      signal: AbortSignal.timeout(this.timeout),
    })
    if (!response.ok) throw new Error(`Weather lookup returned ${response.status}`)
    return response.json() as Promise<T>
  }
}
