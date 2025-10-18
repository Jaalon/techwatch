import React from 'react'
import LinkEditModal from './LinkEditModal'

function LinkItem({
  link,
  tagInputs,
  setTagInputs,
  tagOptions,
  fetchTagOptions,
  onRemoveTag,
  onAddTag,
  onUpdateStatus,
  onAssignNext,
  onDelete
}) {
  const l = link
  const when = l.discoveredAt || l.date
  const whenTxt = when ? new Date(when).toLocaleString() : ''
  const [showMagic, setShowMagic] = React.useState(false)
  const [modalPos, setModalPos] = React.useState({ x: 100, y: 100 })
  const [dragging, setDragging] = React.useState(false)
  const dragOffsetRef = React.useRef({ x: 0, y: 0 })
  const headerRef = React.useRef(null)
  const [desc, setDesc] = React.useState(l.description || '')
  const [apiText, setApiText] = React.useState('')

  // Resize state
  const [modalSize, setModalSize] = React.useState({ w: 600, h: 380 })
  const [resizing, setResizing] = React.useState(false)
  const [resizeDir, setResizeDir] = React.useState('se') // n, s, e, w, ne, nw, se, sw
  const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' })

  const openModal = React.useCallback(() => {
    // Position the modal horizontally centered and align the top with the bottom of the tabs/menu if possible
    const w = typeof window !== 'undefined' ? window.innerWidth : 800
    const h = typeof window !== 'undefined' ? window.innerHeight : 600
    const modalW = modalSize.w || 600
    const modalH = modalSize.h || 380
    const x = Math.max(12, Math.floor((w - modalW) / 2))

    let y = Math.max(12, Math.floor((h - modalH) / 2))
    if (typeof document !== 'undefined') {
      const el = document.querySelector('[data-tabs-bottom], [role="tablist"], #tabs, .tabs')
      if (el && el.getBoundingClientRect) {
        const r = el.getBoundingClientRect()
        // Use viewport space since the modal is fixed-positioned
        y = Math.max(12, Math.min(h - modalH - 12, Math.floor(r.bottom + 8)))
      }
    }

    setModalPos({ x, y })
    setShowMagic(true)
  }, [modalSize.w, modalSize.h])

  const closeModal = React.useCallback(async () => {
    try {
      if ((desc || '') !== (l.description || '')) {
        await fetch(`/api/links/${l.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: desc })
        }).catch(() => {})
      }
    } catch (e) {
      console.error(e)
    } finally {
      setShowMagic(false)
    }
  }, [desc, l])

  const onHeaderMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    dragOffsetRef.current = { x: e.clientX - modalPos.x, y: e.clientY - modalPos.y }
  }

  React.useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      e.preventDefault()
      const w = typeof window !== 'undefined' ? window.innerWidth : 800
      const h = typeof window !== 'undefined' ? window.innerHeight : 600
      // Constrain within viewport lightly
      const x = Math.min(w - 40, Math.max(0, e.clientX - dragOffsetRef.current.x))
      const y = Math.min(h - 40, Math.max(0, e.clientY - dragOffsetRef.current.y))
      setModalPos({ x, y })
    }
    const onUp = () => setDragging(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragging, modalPos.x, modalPos.y])

  const onResizeMouseDown = (dir) => (e) => {
    e.preventDefault()
    setResizing(true)
    setResizeDir(dir)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: modalSize.w, h: modalSize.h, startX: modalPos.x, startY: modalPos.y, dir }
  }

  React.useEffect(() => {
    if (!resizing) return
    const onMove = (e) => {
      e.preventDefault()
      const dx = e.clientX - resizeStartRef.current.x
      const dy = e.clientY - resizeStartRef.current.y
      const wViewport = typeof window !== 'undefined' ? window.innerWidth : 800
      const hViewport = typeof window !== 'undefined' ? window.innerHeight : 600

      let newW = resizeStartRef.current.w
      let newH = resizeStartRef.current.h
      let newX = resizeStartRef.current.startX
      let newY = resizeStartRef.current.startY

      const minW = 320
      const minH = 240
      const padding = 12

      const dir = resizeDir
      // East/West affect width/X
      if (dir.includes('e') && !dir.includes('w')) {
        newW = resizeStartRef.current.w + dx
      }
      if (dir.includes('w')) {
        newW = resizeStartRef.current.w - dx
        newX = resizeStartRef.current.startX + dx
      }
      // North/South affect height/Y
      if (dir.includes('s') && !dir.includes('n')) {
        newH = resizeStartRef.current.h + dy
      }
      if (dir.includes('n')) {
        newH = resizeStartRef.current.h - dy
        newY = resizeStartRef.current.startY + dy
      }

      // Constrain size
      newW = Math.max(minW, newW)
      newH = Math.max(minH, newH)

      // Constrain within viewport (right and bottom edges)
      if (newX + newW > wViewport - padding) {
        if (dir.includes('e') && !dir.includes('w')) {
          newW = Math.max(minW, wViewport - padding - newX)
        } else if (dir.includes('w')) {
          const overflow = newX + newW - (wViewport - padding)
          newX -= overflow
        }
      }
      if (newY + newH > hViewport - padding) {
        if (dir.includes('s') && !dir.includes('n')) {
          newH = Math.max(minH, hViewport - padding - newY)
        } else if (dir.includes('n')) {
          const overflow = newY + newH - (hViewport - padding)
          newY -= overflow
        }
      }

      // Constrain to top/left bounds
      if (newX < padding) {
        const delta = padding - newX
        newX += delta
        if (dir.includes('w')) newW = Math.max(minW, newW - delta)
      }
      if (newY < padding) {
        const delta = padding - newY
        newY += delta
        if (dir.includes('n')) newH = Math.max(minH, newH - delta)
      }

      setModalPos({ x: newX, y: newY })
      setModalSize({ w: newW, h: newH })
    }
    const onUp = () => setResizing(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [resizing, resizeDir])

  React.useEffect(() => {
    if (!showMagic) return
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showMagic, closeModal])

  return (
    <li className="border border-gray-300 p-3 mb-2 rounded text-left">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-2">
          <strong>{l.title}</strong>
          <button
            title="Edit"
            aria-label="Edit"
            onClick={openModal}
            className="tw-btn tw-btn--sm"
          >
            Edit
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <small title="Discovered at">{whenTxt}</small>
          <small>{l.status}</small>
        </div>
      </div>
      <div>
        <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
      </div>
      {l.description && <p>{l.description}</p>}

      {/* Tags section */}
      <div className="my-1">
        <div className="flex gap-2 flex-wrap items-center">
          {(l.tags || []).map(t => (
            <span key={t.id || t.name} className="tw-tag">
              <span>{t.name}</span>
              <button title="Remove tag" onClick={() => onRemoveTag(l.id, t.name)} className="tw-tag__remove">&times;</button>
            </span>
          ))}
          <div className="inline-flex gap-1 items-center">
            <input
              list={`tag-options-${l.id}`}
              placeholder="Add tag..."
              value={tagInputs[l.id] || ''}
              onChange={async e => { const v = e.target.value; setTagInputs(prev => ({ ...prev, [l.id]: v })); await fetchTagOptions(l.id, v) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddTag(l.id, (tagInputs[l.id] || '').trim()) } }}
              className="tw-input min-w-[10rem]"
            />
            <datalist id={`tag-options-${l.id}`}>
              {(tagOptions[l.id] || []).map(opt => (
                <option key={opt.id} value={opt.name} />
              ))}
            </datalist>
            <button className="tw-btn tw-btn--sm" onClick={() => onAddTag(l.id, (tagInputs[l.id] || '').trim())}>Add</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="tw-btn tw-btn--sm" onClick={() => onUpdateStatus(l.id, 'KEEP')}>Keep</button>
        <button className="tw-btn tw-btn--sm" onClick={() => onUpdateStatus(l.id, 'LATER')}>Later</button>
        <button className="tw-btn tw-btn--sm" onClick={() => onUpdateStatus(l.id, 'REJECT')}>Reject</button>
        <button className="tw-btn tw-btn--sm" onClick={() => onAssignNext(l.id)}>Add to next TechWatch</button>
        <button className="tw-btn tw-btn--sm tw-btn--danger ml-auto" onClick={() => onDelete(l.id)}>Delete</button>
      </div>

      {showMagic && (
        <LinkEditModal link={l} onRequestClose={() => setShowMagic(false)} />
      )}
    </li>
  )
}

export default LinkItem
