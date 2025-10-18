import React from 'react'
import LinkEditModal from './LinkEditModal'

function LinkItem({
                      link,
                      onUpdateStatus,
                      onEdited
                  }) {
    const l = link
    const [showMagic, setShowMagic] = React.useState(false)
    const [modalPos, setModalPos] = React.useState({ x: 100, y: 100 })
    const [dragging, setDragging] = React.useState(false)
    const dragOffsetRef = React.useRef({ x: 0, y: 0 })
    const [desc, setDesc] = React.useState(l.description || '')

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
    }, [modalSize.w, modalSize.h, setModalPos, setShowMagic])

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
    }, [desc, l.description, l.id, setShowMagic])

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

    const statusClass = React.useMemo(() => {
        const s = (l.status || '').toUpperCase()
        if (s === 'KEEP') return 'tw-item--keep'
        if (s === 'LATER') return 'tw-item--later'
        if (s === 'REJECT') return 'tw-item--reject'
        return ''
    }, [l.status])

    return (
        <li className={`tw-item ${statusClass} p-3 text-left`} onDoubleClick={openModal}>
            <div className="flex items-start gap-2">
                <div className="flex-1">
                    <a href={l.url}
                       target="_blank"
                       rel="noreferrer"
                       onDoubleClick={(e) => e.stopPropagation()}>{l.title}</a>
                    {l.description ? <span> - {l.description}</span> : null}
                </div>
                <select
                    className="tw-input ml-2"
                    value={l.status || ''}
                    title="Status"
                    onDoubleClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const newStatus = e.target.value
                        if (newStatus && newStatus !== l.status) {
                            try { onUpdateStatus && onUpdateStatus(l.id, newStatus) } catch {}
                        }
                    }}
                >
                    <option value="KEEP">Keep</option>
                    <option value="LATER">Later</option>
                    <option value="REJECT">Reject</option>
                </select>
            </div>

            {showMagic && (
                <LinkEditModal link={l} onRequestClose={() => setShowMagic(false)} onSaved={onEdited} />
            )}
        </li>
    )
}

export default LinkItem
