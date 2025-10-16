import React from 'react'
import { createPortal } from 'react-dom'
import { updateLinkDescription } from '../api/links'
import { summarizeLink } from '../api/ai'

export default function LinkEditModal({ link, onRequestClose }) {
  const l = link

  const [modalPos, setModalPos] = React.useState({ x: 100, y: 100 })
  const [modalSize, setModalSize] = React.useState({ w: 600, h: 380 })
  const [dragging, setDragging] = React.useState(false)
  const [resizing, setResizing] = React.useState(false)
  const [resizeDir, setResizeDir] = React.useState('se')

  const dragOffsetRef = React.useRef({ x: 0, y: 0 })
  const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' })

  const [desc, setDesc] = React.useState(l.description || '')
  const [apiText, setApiText] = React.useState('')

  // Position the modal on mount: center horizontally; top aligned under tabs if found
  React.useEffect(() => {
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
        y = Math.max(12, Math.min(h - modalH - 12, Math.floor(r.bottom + 8)))
      }
    }
    setModalPos({ x, y })
  }, [modalSize.w, modalSize.h])

  const closeModal = React.useCallback(async () => {
    try {
      if ((desc || '') !== (l.description || '')) {
        await updateLinkDescription(l.id, desc)
      }
    } catch (e) {
      console.error(e)
    } finally {
      onRequestClose?.()
    }
  }, [desc, l, onRequestClose])

  // Drag logic
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

  // Resize logic
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
      if (dir.includes('e') && !dir.includes('w')) {
        newW = resizeStartRef.current.w + dx
      }
      if (dir.includes('w')) {
        newW = resizeStartRef.current.w - dx
        newX = resizeStartRef.current.startX + dx
      }
      if (dir.includes('s') && !dir.includes('n')) {
        newH = resizeStartRef.current.h + dy
      }
      if (dir.includes('n')) {
        newH = resizeStartRef.current.h - dy
        newY = resizeStartRef.current.startY + dy
      }

      newW = Math.max(minW, newW)
      newH = Math.max(minH, newH)

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
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeModal])

  const onSummarize = async () => {
    try {
      const r = await summarizeLink(l.id)
      if (r && (r.summary || r.text)) {
        setApiText(r.summary || r.text)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Opaque backdrop */}
      <div className="absolute inset-0 bg-black" onClick={closeModal} />

      {/* Draggable & Resizable window */}
      <div
        className="fixed bg-white rounded shadow-lg border border-gray-200 relative flex flex-col"
        style={{ top: modalPos.y, left: modalPos.x, width: modalSize.w, height: modalSize.h }}
      >
        {/* Header bar (drag handle) */}
        <div
          onMouseDown={onHeaderMouseDown}
          className="cursor-move select-none bg-gray-100 px-3 py-2 flex items-center justify-between gap-2"
        >
          <h3 className="text-base font-semibold truncate" title={l.title}>{l.title}</h3>
          <button aria-label="Close" onClick={closeModal} className="text-xl leading-none px-2">&times;</button>
        </div>

        {/* Body */}
        <div className="p-3 space-y-3 overflow-hidden flex flex-col h-full">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="flex">
            <button type="button" onClick={onSummarize} className="ml-auto mr-auto inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-100">IA summarize</button>
          </div>

          <div className="flex-1 min-h-0">
            <label className="block text-xs font-medium text-gray-600 mb-1">Texte IA (résultat API)</label>
            <div className="w-full border rounded p-2 text-sm h-full overflow-y-auto whitespace-pre-wrap">
              {apiText || 'Le résultat de l\'API apparaîtra ici. Si le texte est long, vous pouvez faire défiler cette zone sans impacter le reste de la fenêtre.'}
            </div>
          </div>
        </div>

        {/* Resize handles */}
        {/* Corners */}
        <div onMouseDown={onResizeMouseDown('nw')} className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize z-10" />
        <div onMouseDown={onResizeMouseDown('ne')} className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize z-10" />
        <div onMouseDown={onResizeMouseDown('sw')} className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize z-10" />
        <div onMouseDown={onResizeMouseDown('se')} className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize z-10" />
        {/* Edges */}
        <div onMouseDown={onResizeMouseDown('n')} className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize z-10" />
        <div onMouseDown={onResizeMouseDown('s')} className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize z-10" />
        <div onMouseDown={onResizeMouseDown('w')} className="absolute top-2 bottom-2 -left-1 w-2 cursor-w-resize z-10" />
        <div onMouseDown={onResizeMouseDown('e')} className="absolute top-2 bottom-2 -right-1 w-2 cursor-e-resize z-10" />
      </div>
    </div>,
    document.body
  )
}
