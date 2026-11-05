import type { TodoCardData } from './TodoModule'

export function TodoCard({ data }: { data: TodoCardData }) {
  if (!data.open.length) return <p>Nothing left to do.</p>
  return (
    <>
      <ul className="card-mini-list">
        {data.open.map((task) => (
          <li key={task.id}>
            <span className="tick" aria-hidden="true">
              ☐
            </span>
            <span>{task.title}</span>
          </li>
        ))}
      </ul>
      {data.count > data.open.length && <p className="meta">{data.count} open in all</p>}
    </>
  )
}
