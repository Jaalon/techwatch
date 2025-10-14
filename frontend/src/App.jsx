import { useEffect, useState } from 'react'
import './App.css'

const API = '/api/links'

function App() {
  const [links, setLinks] = useState([])
  const [form, setForm] = useState({ title: '', url: '', description: '' })
  const [error, setError] = useState('')

  // ToConsider view state
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('date')

  const load = async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (query) params.set('q', query)
      params.set('page', String(page))
      params.set('size', String(size))
      if (sort) params.set('sort', sort)
      const res = await fetch(`${API}?${params.toString()}`)
      const data = await res.json()
      setLinks(data)
      const totalCount = res.headers.get('X-Total-Count')
      setTotal(totalCount ? parseInt(totalCount, 10) : data.length)
    } catch (e) {
      setError('Failed to load links')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, page, size, sort])

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
      // After adding, reload first page to see newest first
      setPage(0)
      await load()
    } catch (e) {
      setError('Error while creating: ' + e.message)
    }
  }

  const remove = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    await load()
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>To consider</h1>

      {/* Search and filter bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          placeholder="Search..."
          value={query}
          onChange={e => { setPage(0); setQuery(e.target.value) }}
          style={{ flex: 1 }}
        />
        <select value={status} onChange={e => { setPage(0); setStatus(e.target.value) }}>
          <option value="">All statuses</option>
          <option value="TO_PROCESS">To process</option>
          <option value="KEEP">Keep</option>
          <option value="LATER">Later</option>
          <option value="REJECT">Rejected</option>
        </select>
        <select value={sort} onChange={e => { setPage(0); setSort(e.target.value) }}>
          <option value="date">Newest first</option>
          <option value="title">Title (A→Z)</option>
        </select>
        <select value={size} onChange={e => { setPage(0); setSize(parseInt(e.target.value, 10)) }}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* Add form */}
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <button type="submit">Add</button>
      </form>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* List */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {links.map(l => {
          const when = l.discoveredAt || l.date
          const whenTxt = when ? new Date(when).toLocaleString() : ''
          return (
            <li key={l.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>{l.title}</strong>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <small title="Discovered at">{whenTxt}</small>
                  <small>{l.status}</small>
                </div>
              </div>
              <div>
                <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
              </div>
              {l.description && <p>{l.description}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => updateStatus(l.id, 'KEEP')}>Keep</button>
                <button onClick={() => updateStatus(l.id, 'LATER')}>Later</button>
                <button onClick={() => updateStatus(l.id, 'REJECT')}>Reject</button>
                <button onClick={() => remove(l.id)} style={{ marginLeft: 'auto' }}>Delete</button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
        <span>Page {page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
      </div>
    </div>
  )
}

export default App
