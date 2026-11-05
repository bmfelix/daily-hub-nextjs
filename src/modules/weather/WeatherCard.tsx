'use client'

import { useEffect, useState } from 'react'

import type { WeatherData } from './WeatherModule'

/** The homepage weather. It runs in the browser, because only the browser knows where the visitor is. */
export function WeatherCard() {
  const [data, setData] = useState<WeatherData | null>(null)

  useEffect(() => {
    const load = (query = '') =>
      fetch(`/live/weather${query}`)
        .then((response) => response.json())
        .then(setData)
        .catch(() => {})
    if (!navigator.geolocation) {
      load()
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => load(`?lat=${coords.latitude.toFixed(2)}&lon=${coords.longitude.toFixed(2)}`),
      () => load(),
      { maximumAge: 600000, timeout: 10000 },
    )
  }, [])

  if (!data) return <p>Current conditions and a 5-day forecast for any city.</p>
  if ('error' in data) return <p>{data.error}</p>
  return (
    <>
      <p className="readout">
        {Math.round(data.current.temperature)}
        {data.temperatureUnit}
      </p>
      <p>
        {data.current.label} in {data.place.name}
      </p>
      <p className="meta">
        Feels like {Math.round(data.current.feelsLike)}° · Wind {Math.round(data.current.wind)} {data.windUnit}
      </p>
      <ul className="mini-week">
        {data.days.slice(1, 5).map((day) => (
          <li key={day.date}>
            <strong>{day.weekday}</strong>
            <span>{day.label}</span>
            <span>
              {Math.round(day.low)}° / {Math.round(day.high)}°
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
