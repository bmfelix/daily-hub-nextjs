import Link from 'next/link'

import type { NotesData } from './NotesModule'

const updated = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function NotesView({ data }: { data: NotesData }) {
  const { note } = data

  return (
    <>
      <p className="kicker">Liner notes</p>
      <h1>Notes</h1>

      <div className="split">
        <aside>
          <ul className="list">
            {data.notes.length ? (
              data.notes.map((item) => (
                <li className={`panel${item.id === note?.id ? ' is-active' : ''}`} key={item.id}>
                  <Link href={`/notes?note=${item.id}`}>{item.title}</Link>
                  <span className="meta">Updated {updated.format(new Date(item.updatedAt))}</span>
                </li>
              ))
            ) : (
              <li className="lead">No notes yet.</li>
            )}
          </ul>
        </aside>

        <section className="panel">
          {note ? (
            <>
              <h2>{note.title}</h2>
              {(note.body ?? '').split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </>
          ) : (
            <p className="lead">Choose a note to read it.</p>
          )}
        </section>
      </div>
    </>
  )
}
