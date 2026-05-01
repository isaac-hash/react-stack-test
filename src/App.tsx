import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Task = {
  id: number
  title: string
  description?: string | null
  completed: boolean
}

type TaskForm = {
  title: string
  description: string
  completed: boolean
}

const DEFAULT_FORM: TaskForm = {
  title: '',
  description: '',
  completed: false,
}

function App() {
  const apiUrl = useMemo(() => {
    const apiPath = import.meta.env.VITE_API_PATH
    if (typeof apiPath === 'string' && apiPath.length > 0) {
      return apiPath.replace(/\/$/, '')
    }
    // return (import.meta.env.VITE_API_URL || 'http://77.68.50.228:3015').replace(/\/$/, '')
    // return ('http://77.68.50.228:3015').replace(/\/$/, '')
    return ('http://77.68.54.204:3013/').replace(/\/$/, '')
  }, [])

  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState<TaskForm>(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = `${apiUrl}/tasks/`

  useEffect(() => {
    fetchTasks()
  }, [endpoint])

  async function fetchTasks() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`Failed to load tasks: ${response.status}`)
      }
      const data = (await response.json()) as Task[]
      setTasks(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `${endpoint}${editingId}` : endpoint
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`)
      }
      await fetchTasks()
      resetForm()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function removeTask(id: number) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${endpoint}${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`)
      }
      await fetchTasks()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleCompleted(task: Task) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${endpoint}${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
      await fetchTasks()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function editTask(task: Task) {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Task CRUD</h1>
        <p>Backend API: <code>{apiUrl}</code></p>
      </header>

      <section className="task-form-section">
        <h2>{editingId ? 'Edit task' : 'Create task'}</h2>
        <form onSubmit={saveTask} className="task-form">
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Enter title"
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Enter description"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.completed}
              onChange={(event) => setForm({ ...form, completed: event.target.checked })}
            />
            Completed
          </label>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {editingId ? 'Update task' : 'Create task'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="task-list-section">
        <div className="task-list-header">
          <h2>Tasks</h2>
          <button type="button" onClick={fetchTasks} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {loading && <p>Loading...</p>}
        {!loading && tasks.length === 0 && <p>No tasks yet.</p>}

        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={task.completed ? 'task-completed' : ''}>
              <div className="task-main">
                <button
                  type="button"
                  className="toggle-complete"
                  onClick={() => toggleCompleted(task)}
                >
                  {task.completed ? '☑' : '☐'}
                </button>
                <div>
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                </div>
              </div>
              <div className="task-actions">
                <button type="button" onClick={() => editTask(task)} disabled={loading}>
                  Edit
                </button>
                <button type="button" onClick={() => removeTask(task.id)} disabled={loading}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
