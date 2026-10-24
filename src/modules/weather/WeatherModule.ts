import { HubModule, param, type SearchParams } from '../HubModule'
import { OpenMeteoClient, type Place } from './OpenMeteoClient'
import { WeatherView } from './WeatherView'

// WMO weather codes used by Open-Meteo, grouped into plain labels.
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
}

const label = (code: number) => WEATHER_CODES[code] ?? 'Unknown'

export type WeatherData =
  | { city: string; error: string }
  | {
      city: string
      place: Place
      current: { temperature: number; feelsLike: number; wind: number; label: string }
      days: { date: string; label: string; high: number; low: number }[]
    }

export class WeatherModule extends HubModule<WeatherData> {
  readonly slug = 'weather'
  readonly title = 'Weather'
  readonly summary = 'Current conditions and a 5-day forecast for any city.'
  readonly View = WeatherView

  defaultCity = 'London'

  constructor(private client = new OpenMeteoClient()) {
    super()
  }

  async load(params: SearchParams): Promise<WeatherData> {
    const city = param(params, 'city') || this.defaultCity
    try {
      const place = await this.client.findPlace(city)
      if (!place) return { city, error: `No place found called “${city}”.` }
      const { current, daily } = await this.client.forecast(place.latitude, place.longitude)
      return {
        city,
        place,
        current: {
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          wind: current.wind_speed_10m,
          label: label(current.weather_code),
        },
        days: daily.time.map((date, i) => ({
          date,
          label: label(daily.weather_code[i]),
          high: daily.temperature_2m_max[i],
          low: daily.temperature_2m_min[i],
        })),
      }
    } catch {
      return { city, error: 'The weather service did not respond. Try again shortly.' }
    }
  }
}
