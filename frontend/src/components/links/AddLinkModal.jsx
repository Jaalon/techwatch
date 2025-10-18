import React, { useState } from 'react'
import { createLink as apiCreateLink } from '../../api/links'
import Modal from '../common/Modal'

export default function AddLinkModal({ onAdded }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const open = () => { setError(''); setIsOpen(true) }
  const close = () => setIsOpen(false)

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
      setIsOpen(false)
    } catch (e) {
      setError('Error while creating: ' + (e?.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-1">
      <div className="flex items-center justify-between">
        <button type="button" onClick={open} className="tw-btn tw-btn--md">Add a Link</button>
      </div>

      <Modal
        isOpen={isOpen}
        onRequestClose={close}
        title="Add a link"
        initialSize={{ w: 640, h: 260 }}
        draggable={true}
        resizable={true}
        footerContent={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="tw-btn">Cancel</button>
            <button type="submit" form="add-link-form" disabled={loading || !title || !url} className="tw-btn">
              {loading ? 'Adding…' : 'Add'}
            </button>
          </div>
        }
      >
        {error && <div className="tw-error mb-2">{error}</div>}
        <form id="add-link-form" onSubmit={submit} className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label>Title</label>
            <input className="tw-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col min-w-[280px]">
            <label>URL</label>
            <input className="tw-input" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="flex flex-col flex-1 min-w-[240px]">
            <label>Description</label>
            <input className="tw-input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </form>
      </Modal>
    </section>
  )
}
