import React, { useState } from 'react'
import { createLink as apiCreateLink } from '../../api/links'

export default function AddLinkComponent({ onAdded }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title || !url) {
      setError('Title and URL are required')
      return
    }
    try {
      setLoading(true)
      await apiCreateLink({ title, url, description })
      setTitle('')
      setUrl('')
      setDescription('')
      if (typeof onAdded === 'function') onAdded()
    } catch (e) {
      setError('Error while creating: ' + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-4">
      <h3 className="mt-0">Add a link</h3>
      {error && <div className="error mb-2">{error}</div>}
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col min-w-[280px]">
          <label>URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="flex flex-col flex-1 min-w-[240px]">
          <label>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add'}</button>
      </form>
    </section>
  )
}
