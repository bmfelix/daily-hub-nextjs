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

// Countries and territories that report the weather in Fahrenheit.
const FAHRENHEIT_COUNTRIES = new Set(['US', 'PR', 'GU', 'VI', 'AS', 'MP', 'BS', 'BZ', 'KY', 'LR', 'PW', 'FM', 'MH'])

const label = (code: number) => WEATHER_CODES[code] ?? 'Unknown'

type WeatherResult =
  | { city: string; error: string }
  | {
      city: string
      place: Place
      temperatureUnit: string
      windUnit: string
      current: { temperature: number; feelsLike: number; wind: number; label: string }
      days: { date: string; label: string; high: number; low: number }[]
    }

export type WeatherData = WeatherResult & { locate: boolean }

type Coordinates = { latitude: number; longitude: number }

/** Read the visitor's position from the URL, ignoring missing or invalid values. */
function readCoordinates(params: SearchParams): Coordinates | null {
  const lat = param(params, 'lat')
  const lon = param(params, 'lon')
  if (!lat || !lon) return null
  const latitude = Number(lat)
  const longitude = Number(lon)
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null
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
    const searched = param(params, 'city')
    const coordinates = searched ? null : readCoordinates(params)
    // Only ask the browser for a location when nothing was chosen yet.
    const locate = !searched && !coordinates
    return { locate, ...(await this.lookup(searched, coordinates)) }
  }

  private async lookup(searched: string, coordinates: Coordinates | null): Promise<WeatherResult> {
    let city = coordinates ? '' : searched || this.defaultCity
    try {
      const place = coordinates
        ? await this.client.placeAt(coordinates.latitude, coordinates.longitude)
        : await this.client.findPlace(city)
      if (!place) {
        return {
          city,
          error: coordinates ? 'No town found near your location.' : `No place found called “${city}”.`,
        }
      }
      if (coordinates) city = place.name
      const imperial = FAHRENHEIT_COUNTRIES.has(place.country_code ?? '')
      const { current, daily } = await this.client.forecast(place.latitude, place.longitude, imperial)
      return {
        city,
        place,
        temperatureUnit: imperial ? '°F' : '°C',
        windUnit: imperial ? 'mph' : 'km/h',
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
