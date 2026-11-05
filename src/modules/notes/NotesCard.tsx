import type { Note } from '@/payload-types'

const updated = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })

export function NotesCard({ data }: { data: Note | null }) {
  if (!data) return <p>No notes yet.</p>
  const body = data.body ?? ''
  return (
    <>
      <strong>{data.title}</strong>
      <p>{body.length > 140 ? `${body.slice(0, 139)}…` : body}</p>
      <p className="meta">Updated {updated.format(new Date(data.updatedAt))}</p>
    </>
  )
}
