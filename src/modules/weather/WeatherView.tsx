import type { WeatherData } from './WeatherModule'

export function WeatherView({ data }: { data: WeatherData }) {
  return (
    <>
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
          <section className="panel">
            <h2>
              {data.place.name}
              {data.place.country && `, ${data.place.country}`}
            </h2>
            <p className="big">{data.current.temperature}°C</p>
            <p>
              {data.current.label} · Feels like {data.current.feelsLike}°C · Wind {data.current.wind} km/h
            </p>
          </section>

          <h2>Next 5 days</h2>
          <ul className="forecast">
            {data.days.map((day) => (
              <li className="panel" key={day.date}>
                <strong>{day.date}</strong>
                <span>{day.label}</span>
                <span>
                  {day.low}° / {day.high}°
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="source">Data: Open-Meteo</p>
    </>
  )
}
