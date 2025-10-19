import React from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function LinkContentModal({ title, content, onRequestClose }) {
    const [modalPos, setModalPos] = React.useState({ x: 120, y: 120 })
    const [modalSize, setModalSize] = React.useState({ w: 720, h: 640 })
    const [dragging, setDragging] = React.useState(false)
    const [resizing, setResizing] = React.useState(false)
    const [resizeDir, setResizeDir] = React.useState('se')

    const dragOffsetRef = React.useRef({ x: 0, y: 0 })
    const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' })

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

            const minW = 360
            const minH = 240
            const padding = 12

            const dir = resizeDir
            if (dir.includes('e') && !dir.includes('w')) newW = resizeStartRef.current.w + dx
            if (dir.includes('w')) { newW = resizeStartRef.current.w - dx; newX = resizeStartRef.current.startX + dx }
            if (dir.includes('s') && !dir.includes('n')) newH = resizeStartRef.current.h + dy
            if (dir.includes('n')) { newH = resizeStartRef.current.h - dy; newY = resizeStartRef.current.startY + dy }

            newW = Math.max(minW, newW)
            newH = Math.max(minH, newH)

            if (newX + newW > wViewport - padding) {
                if (dir.includes('e') && !dir.includes('w')) newW = Math.max(minW, wViewport - padding - newX)
                else if (dir.includes('w')) { const overflow = newX + newW - (wViewport - padding); newX -= overflow }
            }
            if (newY + newH > hViewport - padding) {
                if (dir.includes('s') && !dir.includes('n')) newH = Math.max(minH, hViewport - padding - newY)
                else if (dir.includes('n')) { const overflow = newY + newH - (hViewport - padding); newY -= overflow }
            }

            if (newX < padding) { const d = padding - newX; newX += d; if (dir.includes('w')) newW = Math.max(minW, newW - d) }
            if (newY < padding) { const d = padding - newY; newY += d; if (dir.includes('n')) newH = Math.max(minH, newH - d) }

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
        const onKey = (e) => { if (e.key === 'Escape') onRequestClose?.() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onRequestClose])

    return createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
            <div className="absolute inset-0 tw-modal-backdrop" onClick={() => onRequestClose?.()} />
            <div className="relative flex flex-col tw-modal-window"
                 style={{ top: modalPos.y, left: modalPos.x, width: modalSize.w, height: modalSize.h }}>
                <div onMouseDown={onHeaderMouseDown}
                     className="cursor-move select-none px-3 py-2 flex items-center justify-between gap-2 tw-modal-header">
                    <h3 className="text-base font-semibold truncate" title={title || 'Content'}>{title || 'Content'}</h3>
                    <button aria-label="Close" onClick={() => onRequestClose?.()} className="tw-btn tw-btn--sm">&times;</button>
                </div>

                <div className="p-3 overflow-hidden flex-1 min-h-0 flex flex-col tw-modal-surface">
                    <div className="flex-1 min-h-0 overflow-auto tw-panel p-4">
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content || ''}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Resize handles */}
                <div onMouseDown={onResizeMouseDown('nw')} className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize z-10" />
                <div onMouseDown={onResizeMouseDown('ne')} className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize z-10" />
                <div onMouseDown={onResizeMouseDown('sw')} className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize z-10" />
                <div onMouseDown={onResizeMouseDown('se')} className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize z-10" />
                <div onMouseDown={onResizeMouseDown('n')} className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize z-10" />
                <div onMouseDown={onResizeMouseDown('s')} className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize z-10" />
                <div onMouseDown={onResizeMouseDown('w')} className="absolute top-2 bottom-2 -left-1 w-2 cursor-w-resize z-10" />
                <div onMouseDown={onResizeMouseDown('e')} className="absolute top-2 bottom-2 -right-1 w-2 cursor-e-resize z-10" />
            </div>
        </div>,
        document.body
    )
}
