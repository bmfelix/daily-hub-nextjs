import type { TodoData } from './TodoModule'

export function TodoView({ data }: { data: TodoData }) {
  return (
    <>
      <p className="kicker">The set list</p>
      <h1>To-do</h1>

      {data.tasks.length ? (
        <ul className="list">
          {data.tasks.map((task) => (
            <li className={`panel task${task.done ? ' is-done' : ''}`} key={task.id}>
              <span aria-label={task.done ? 'Done' : 'Not done'}>{task.done ? '☑' : '☐'}</span>
              <span className="task-title">{task.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lead">No tasks yet.</p>
      )}
    </>
  )
}
