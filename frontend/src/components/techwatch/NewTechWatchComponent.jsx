import React, { useState } from 'react'
import { createTechWatch as apiCreateTechWatch } from '../../api/techwatch'

export default function NewTechWatchComponent({ onCreated }) {
  const [date, setDate] = useState('')
  const [maxArticles, setMaxArticles] = useState(10)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!date) {
      setError('TechWatch date is required')
      return
    }
    try {
      setLoading(true)
      await apiCreateTechWatch({ date, maxArticles })
      setDate('')
      setMaxArticles(10)
      if (typeof onCreated === 'function') onCreated()
    } catch (e) {
      setError('Failed to create TechWatch: ' + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border border-gray-300 p-4 mb-4 rounded">
      <h3 className="mt-0">New TechWatch</h3>
      {error && <div className="error mb-2">{error}</div>}
      <form onSubmit={submit} className="flex gap-2 flex-wrap items-center mb-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input type="number" min={1} max={100} value={maxArticles}
               onChange={e => setMaxArticles(parseInt(e.target.value || '10', 10))}
               title="Max articles" className="w-32" />
        <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create planned TechWatch'}</button>
      </form>
    </section>
  )
}
