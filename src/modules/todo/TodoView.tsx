import { addTask, deleteTask, toggleTask } from './actions'
import type { TodoData } from './TodoModule'

export function TodoView({ data }: { data: TodoData }) {
  return (
    <>
      <h1>To-do</h1>

      <form className="inline-form" action={addTask}>
        <label htmlFor="title">New task</label>
        <input id="title" name="title" maxLength={200} required />
        <button type="submit">Add</button>
      </form>
      {data.error && <p className="notice">{data.error}</p>}

      {data.tasks.length ? (
        <ul className="list">
          {data.tasks.map((task) => (
            <li className={`panel task${task.done ? ' is-done' : ''}`} key={task.id}>
              <form action={toggleTask}>
                <input type="hidden" name="task" value={task.id} />
                <button
                  className="link-button"
                  type="submit"
                  aria-label={`Mark ${task.title} as ${task.done ? 'not done' : 'done'}`}
                >
                  {task.done ? '☑' : '☐'}
                </button>
              </form>
              <span className="task-title">{task.title}</span>
              <form action={deleteTask}>
                <input type="hidden" name="task" value={task.id} />
                <button className="link-button" type="submit">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lead">No tasks yet.</p>
      )}
    </>
  )
}
