const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export type Place = { name: string; country?: string; latitude: number; longitude: number }

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

/** Talks to Open-Meteo, a free weather API that needs no key. */
export class OpenMeteoClient {
  timeout = 8000

  async findPlace(name: string): Promise<Place | null> {
    const url = `${GEOCODE_URL}?${new URLSearchParams({ name, count: '1' })}`
    const data = await this.getJson<{ results?: Place[] }>(url)
    return data.results?.[0] ?? null
  }

  async forecast(latitude: number, longitude: number): Promise<Forecast> {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: '5',
    })
    return this.getJson<Forecast>(`${FORECAST_URL}?${query}`)
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(this.timeout) })
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`)
    return response.json() as Promise<T>
  }
}
