import React from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

/**
 * Reusable Modal component with optional dragging and resizing.
 * Styling:
 * - Backdrop matches the LLM add component (semi-transparent dark overlay)
 * - Content container is white (dark: slate-800) with rounded corners and shadow
 * - Inputs inside get a border and slightly darker background via the .tw-modal-surface wrapper
 */
export default function Modal({
                                  isOpen,
                                  onRequestClose,
                                  title,
                                  children,
                                  initialPosition = { x: 100, y: 100 },
                                  initialSize = { w: 600, h: 380 },
                                  draggable = true,
                                  resizable = true,
                                  minWidth = 320,
                                  minHeight = 240,
                                  padding = 12,
                                  className = '',
                                  footerContent,
                              }) {
    const [modalPos, setModalPos] = React.useState({ x: initialPosition.x, y: initialPosition.y })
    const [modalSize, setModalSize] = React.useState({ w: initialSize.w, h: initialSize.h })
    const [dragging, setDragging] = React.useState(false)
    const [resizing, setResizing] = React.useState(false)
    const [resizeDir, setResizeDir] = React.useState('se')

    const dragOffsetRef = React.useRef({ x: 0, y: 0 })
    const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' })

    React.useEffect(() => {
        setModalPos({ x: initialPosition.x, y: initialPosition.y })
    }, [initialPosition.x, initialPosition.y])

    React.useEffect(() => {
        setModalSize({ w: initialSize.w, h: initialSize.h })
    }, [initialSize.w, initialSize.h])

    const closeModal = React.useCallback(() => {
        onRequestClose?.()
    }, [onRequestClose])

    // Drag logic
    const onHeaderMouseDown = (e) => {
        if (!draggable) return
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
        if (!resizable) return
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

            newW = Math.max(minWidth, newW)
            newH = Math.max(minHeight, newH)

            if (newX + newW > wViewport - padding) {
                if (dir.includes('e') && !dir.includes('w')) {
                    newW = Math.max(minWidth, wViewport - padding - newX)
                } else if (dir.includes('w')) {
                    const overflow = newX + newW - (wViewport - padding)
                    newX -= overflow
                }
            }
            if (newY + newH > hViewport - padding) {
                if (dir.includes('s') && !dir.includes('n')) {
                    newH = Math.max(minHeight, hViewport - padding - newY)
                } else if (dir.includes('n')) {
                    const overflow = newY + newH - (hViewport - padding)
                    newY -= overflow
                }
            }

            if (newX < padding) {
                const delta = padding - newX
                newX += delta
                if (dir.includes('w')) newW = Math.max(minWidth, newW - delta)
            }
            if (newY < padding) {
                const delta = padding - newY
                newY += delta
                if (dir.includes('n')) newH = Math.max(minHeight, newH - delta)
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
    }, [resizing, resizeDir, minWidth, minHeight, padding])

    React.useEffect(() => {
        if (!isOpen) return
        const onKey = (e) => { if (e.key === 'Escape') closeModal() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, closeModal])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            {/* Backdrop matches the LLM add component */}
            <div className="absolute inset-0 tw-modal-backdrop" onClick={closeModal} />

            {/* Window */}
            <div
                className={
                    "relative flex flex-col tw-modal-window " +
                    className
                }
                style={{ top: modalPos.y, left: modalPos.x, width: modalSize.w, height: modalSize.h }}
            >
                {/* Header (drag handle) */}
                <div
                    onMouseDown={onHeaderMouseDown}
                    className={"select-none px-3 py-2 flex items-center justify-between gap-2 " + (draggable ? "cursor-move " : "cursor-default ") + "tw-modal-header"}
                >
                    <h3 className="text-base font-semibold truncate m-0" title={typeof title === 'string' ? title : undefined}>
                        {title}
                    </h3>
                    <button aria-label="Close" onClick={closeModal} className="tw-btn tw-btn--sm">&times;</button>
                </div>

                {/* Body */}
                <div className="p-3 overflow-hidden flex-1 min-h-0 tw-modal-surface">
                    {children}
                </div>

                {/* Footer */}
                {footerContent && (
                    <div className="px-3 py-2 tw-modal-footer">
                        {footerContent}
                    </div>
                )}

                {/* Resize handles */}
                {resizable && (
                    <>
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
                    </>
                )}
            </div>
        </div>,
        document.body
    )
}
