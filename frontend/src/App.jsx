import { useEffect, useState } from 'react'
import './App.css'

const API = '/api/links'
const TECHWATCH_API = '/api/techwatch'

function App() {
  const [links, setLinks] = useState([])
  const [form, setForm] = useState({ title: '', url: '', description: '' })
  const [error, setError] = useState('')

  // TechWatch state
  const [activeTechWatch, setActiveTechWatch] = useState(null)
  const [techWatchForm, setTechWatchForm] = useState({ date: '' })
  const [techWatches, setTechWatches] = useState([])

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
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Server error (${res.status})`)
      }
      const data = await res.json()
      setLinks(Array.isArray(data) ? data : [])
      const totalCount = res.headers.get('X-Total-Count')
      setTotal(totalCount ? parseInt(totalCount, 10) : (Array.isArray(data) ? data.length : 0))
    } catch (e) {
      console.error(e)
      setLinks([]) // keep skeleton visible
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error: ${e.message}`)
    }
  }

  useEffect(() => {
    load()
    loadActiveTechWatch()
    loadTechWatches()
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

  // TechWatch functions
  const loadActiveTechWatch = async () => {
    try {
      const res = await fetch(`${TECHWATCH_API}/active`)
      if (res.status === 204) {
        setActiveTechWatch(null)
        return
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Server error (${res.status})`)
      }
      const data = await res.json()
      setActiveTechWatch(data)
    } catch (e) {
      console.error(e)
      setActiveTechWatch(null)
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
    }
  }

  const loadTechWatches = async () => {
    try {
      const res = await fetch(TECHWATCH_API)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Server error (${res.status})`)
      }
      const data = await res.json()
      setTechWatches(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setTechWatches([])
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
    }
  }

  const createTechWatch = async (e) => {
    e.preventDefault()
    if (!techWatchForm.date) {
      setError('TechWatch date is required')
      return
    }
    try {
      const res = await fetch(TECHWATCH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: techWatchForm.date })
      })
      if (!res.ok) throw new Error(await res.text())
      setTechWatchForm({ date: '' })
      await loadTechWatches()
    } catch (e) {
      setError('Failed to create TechWatch: ' + e.message)
    }
  }

  const activateTechWatch = async (id) => {
    await fetch(`${TECHWATCH_API}/${id}/activate`, { method: 'POST' })
    await loadActiveTechWatch()
    await loadTechWatches()
  }

  const completeTechWatch = async (id) => {
    await fetch(`${TECHWATCH_API}/${id}/complete`, { method: 'POST' })
    await loadActiveTechWatch()
    await loadTechWatches()
  }

  const collectNextLinks = async (id) => {
    await fetch(`${TECHWATCH_API}/${id}/collect-next-links`, { method: 'POST' })
    await load()
  }

  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>To consider</h1>

      {/* TechWatch Panel */}
      <section style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>TechWatch</h2>
        {/* Active TechWatch */}
        {activeTechWatch ? (
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Active TechWatch:</strong> {activeTechWatch.date}
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => collectNextLinks(activeTechWatch.id)}>Collect Next TechWatch links</button>
              <button onClick={() => completeTechWatch(activeTechWatch.id)}>Complete</button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '0.75rem' }}>No active TechWatch</div>
        )}

        {/* Create planned TechWatch */}
        <form onSubmit={createTechWatch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input type="date" value={techWatchForm.date} onChange={e => setTechWatchForm({ ...techWatchForm, date: e.target.value })} />
          <button type="submit">Create planned TechWatch</button>
        </form>

        {/* Recent TechWatch */}
        <div>
          <strong>Recent TechWatch</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {techWatches.slice(0, 5).map(m => (
              <li key={m.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.25rem 0' }}>
                <span>#{m.id} — {m.date} — {m.status}</span>
                <button onClick={() => activateTechWatch(m.id)} disabled={m.status === 'ACTIVE'}>Activate</button>
                <button onClick={() => completeTechWatch(m.id)} disabled={m.status === 'COMPLETED'}>Complete</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
          <option value="NEXT_TECHWATCH">Next TechWatch</option>
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
