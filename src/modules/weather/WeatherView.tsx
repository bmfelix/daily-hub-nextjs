import { LocateVisitor } from './LocateVisitor'
import type { WeatherData } from './WeatherModule'

export function WeatherView({ data }: { data: WeatherData }) {
  return (
    <>
      <p className="kicker">Outside the venue</p>
      <h1>Weather</h1>

      <form className="inline-form" method="get">
        <label htmlFor="city">City</label>
        <input id="city" name="city" defaultValue={data.city} required />
        <button type="submit">Show weather</button>
      </form>

      {'error' in data ? (
        <p className="notice">{data.error}</p>
      ) : (
        <>
          <section className="sky">
            <h2>
              {data.place.name}
              {data.place.country && `, ${data.place.country}`}
            </h2>
            <p className="big">
              {data.current.temperature}
              {data.temperatureUnit}
            </p>
            <p>
              {data.current.label} · Feels like {data.current.feelsLike}
              {data.temperatureUnit} · Wind {data.current.wind} {data.windUnit}
            </p>
          </section>

          <h2>Next 5 days</h2>
          <ul className="week">
            {data.days.map((day) => (
              <li key={day.date}>
                <strong>{day.weekday}</strong>
                <span>{day.label}</span>
                <span className="range" aria-hidden="true">
                  <span style={{ left: `${day.barStart}%`, width: `${day.barWidth}%` }} />
                </span>
                <span className="temps">
                  {day.low}° / {day.high}°
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="source">Data: Open-Meteo · Place names: OpenStreetMap</p>

      {data.locate && <LocateVisitor />}
    </>
  )
}
