import Link from 'next/link'

import { deleteNote, saveNote } from './actions'
import type { NotesData } from './NotesModule'

const updated = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function NotesView({ data }: { data: NotesData }) {
  const { note } = data

  return (
    <>
      <h1>Notes</h1>

      <div className="split">
        <aside>
          <p>
            <Link href="/notes">+ New note</Link>
          </p>
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
          <h2>{note ? 'Edit note' : 'New note'}</h2>
          {data.error && <p className="notice">{data.error}</p>}
          {/* key resets the form fields when switching notes */}
          <form className="stack-form" action={saveNote} key={note?.id ?? 'new'}>
            {note && <input type="hidden" name="note" value={note.id} />}
            <div>
              <label htmlFor="note-title">Title</label>
              <input id="note-title" name="title" defaultValue={note?.title ?? ''} maxLength={200} required />
            </div>
            <div>
              <label htmlFor="note-body">Body</label>
              <textarea id="note-body" name="body" rows={8} defaultValue={note?.body ?? ''} />
            </div>
            <div className="actions">
              <button type="submit" name="action" value="save">
                Save
              </button>
              {note && (
                <button className="link-button" type="submit" formAction={deleteNote} formNoValidate>
                  Delete
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </>
  )
}
