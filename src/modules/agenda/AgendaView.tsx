import { longDate } from '../concerts/dates'
import type { AgendaData } from './AgendaModule'

export function AgendaView({ data }: { data: AgendaData }) {
  return (
    <>
      <p className="kicker">Tour dates</p>
      <h1>Agenda</h1>

      {'error' in data ? (
        <p className="notice">{data.error}</p>
      ) : (
        <>
          {data.failed > 0 && (
            <p className="notice">
              {data.failed} calendar{data.failed === 1 ? '' : 's'} could not be read.
            </p>
          )}
          {data.days.length ? (
            data.days.map((day) => (
              <section className="agenda-day" key={day.date}>
                <h2>{longDate(day.date)}</h2>
                <ul className="list">
                  {day.items.map((item, i) => (
                    <li className="panel agenda-item" key={`${item.title}-${i}`}>
                      <span className="agenda-time">{item.allDay ? 'All day' : item.time}</span>
                      <strong>{item.title}</strong>
                      {item.location && <span className="meta">{item.location}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className="lead">Nothing on your calendars for two weeks.</p>
          )}
        </>
      )}
    </>
  )
}
