import { useEffect, useState } from 'react'
import './App.css'

const API = '/api/links'

function App() {
  const [links, setLinks] = useState([])
  const [form, setForm] = useState({ title: '', url: '', description: '' })
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const res = await fetch(API)
      const data = await res.json()
      setLinks(data)
    } catch (e) {
      setError('Failed to load links')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.url) {
      setError('Title and URL are required')
      return
    }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'API error')
      }
      setForm({ title: '', url: '', description: '' })
      await load()
    } catch (e) {
      setError('Error while creating: ' + e.message)
    }
  }

  const remove = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Tech watch links</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <button type="submit">Add</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {links.map(l => (
          <li key={l.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{l.title}</strong>
              <small>{l.status}</small>
            </div>
            <div>
              <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
            </div>
            {l.description && <p>{l.description}</p>}
            <button onClick={() => remove(l.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
