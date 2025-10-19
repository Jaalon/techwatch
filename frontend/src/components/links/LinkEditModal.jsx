import React from 'react'
import { createPortal } from 'react-dom'
import { updateLink as apiUpdateLink, deleteLink as apiDeleteLink, assignToNext as apiAssignToNext, invalidateSummary as apiInvalidateSummary } from '../../api/links'
import { summarizeLink } from '../../api/ai'
import TagRow from './TagRow'
import LinkEditFooter from './LinkEditFooter'
import LinkContentModal from './LinkContentModal'

export default function LinkEditModal({ link, onRequestClose, onSaved }) {
    const l = link

    const [modalPos, setModalPos] = React.useState({ x: 100, y: 100 })
    const [modalSize, setModalSize] = React.useState({ w: 640, h: 600 })
    const [dragging, setDragging] = React.useState(false)
    const [resizing, setResizing] = React.useState(false)
    const [resizeDir, setResizeDir] = React.useState('se')

    const dragOffsetRef = React.useRef({ x: 0, y: 0 })
    const resizeStartRef = React.useRef({ x: 0, y: 0, w: 0, h: 0, startX: 0, startY: 0, dir: 'se' })

    const [title, setTitle] = React.useState(l.title || '')
    const [url, setUrl] = React.useState(l.url || '')
    const [desc, setDesc] = React.useState(l.description || '')
    const [apiText, setApiText] = React.useState(l.summary || '')
    const [status, setStatus] = React.useState(l.status || '')
    const [assigningNext, setAssigningNext] = React.useState(false)
    const [assignedNext, setAssignedNext] = React.useState(false)
    const [summarizeLoading, setSummarizeLoading] = React.useState(false)
    const [summarizeError, setSummarizeError] = React.useState('')

    const [showContent, setShowContent] = React.useState(false)

    // Ref to the inner fields box (the bordered container) to keep it scrollbar-free
    const fieldsBoxRef = React.useRef(null)

    // Ensure the modal height is adjusted so the fields box does not show a scrollbar
    const fitBoxNoScroll = React.useCallback(() => {
        const box = fieldsBoxRef.current
        if (!box) return
        const scrollH = box.scrollHeight
        const clientH = box.clientHeight
        const diff = Math.round(scrollH - clientH)
        if (Math.abs(diff) < 1) return
        const hViewport = typeof window !== 'undefined' ? window.innerHeight : 600
        const padding = 12
        let newH = (modalSize?.h || 0) + diff
        newH = Math.max(240, newH)
        if (modalPos.y + newH > hViewport - padding) {
            newH = Math.max(240, hViewport - padding - modalPos.y)
        }
        if (newH !== (modalSize?.h || 0)) {
            setModalSize(prev => ({ ...prev, h: newH }))
        }
    }, [modalPos.y, modalSize.h, fieldsBoxRef.current, setModalSize])

    // Fit on mount (layout to avoid flicker)
    React.useLayoutEffect(() => {
        fitBoxNoScroll()
    }, [])

    // Fit when content likely changes
    React.useEffect(() => {
        fitBoxNoScroll()
    }, [title, url, desc, apiText, status, fitBoxNoScroll])

    // Observe the fields box size/content changes (textarea manual resize, etc.)
    React.useEffect(() => {
        const box = fieldsBoxRef.current
        if (!box || typeof window === 'undefined' || !('ResizeObserver' in window)) return
        const ro = new ResizeObserver(() => { fitBoxNoScroll() })
        ro.observe(box)
        return () => ro.disconnect()
    }, [fitBoxNoScroll])

    // Position the modal on mount: center horizontally; top aligned under tabs if found
    React.useEffect(() => {
        // Align initial position with generic Modal default (same as AddLinkModal)
        setModalPos({ x: 100, y: 100 })
    }, [])

    // Prefill fields when opening or when link changes
    React.useEffect(() => {
        setTitle(l.title || '')
        setUrl(l.url || '')
        setDesc(l.description || '')
        setApiText(l.summary || '')
        setStatus(l.status || '')
        const alreadyInNext = !!(l && (l.inNextMvt || l.inNext || l.assignedToNext || l.inNextTw || l.inNextTW))
        setAssignedNext(alreadyInNext)
    }, [l && l.id, l && l.title, l && l.url, l && l.description, l && l.summary, l && l.status, l && l.inNextMvt, l && l.inNext, l && l.assignedToNext, l && l.inNextTw, l && l.inNextTW])


    const closeModal = React.useCallback(async () => {
        try {
            const payload = {}
            if ((title || '') !== (l.title || '')) payload.title = title
            if ((url || '') !== (l.url || '')) payload.url = url
            if ((desc || '') !== (l.description || '')) payload.description = desc
            if ((status || '') !== (l.status || '')) payload.status = status
            if (Object.keys(payload).length > 0) {
                await apiUpdateLink(l.id, payload)
            }
        } catch (e) {
            console.error(e)
        } finally {
            onRequestClose?.()
        }
    }, [title, url, desc, status, onRequestClose, l.title, l.url, l.description, l.status, l.id])

    // Save and close helper (used by footer Save button and Ctrl/Cmd+Enter)
    const saveAndClose = React.useCallback(async () => {
        try {
            const payload = {}
            if ((title || '') !== (l.title || '')) payload.title = title
            if ((url || '') !== (l.url || '')) payload.url = url
            if ((desc || '') !== (l.description || '')) payload.description = desc
            if ((status || '') !== (l.status || '')) payload.status = status
            if (Object.keys(payload).length > 0) {
                await apiUpdateLink(l.id, payload)
            }
        } catch (e) {
            console.error(e)
        } finally {
            try { onSaved && onSaved() } catch {}
            onRequestClose?.()
        }
    }, [title, url, desc, status, onSaved, onRequestClose, l.title, l.url, l.description, l.status, l.id])

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
        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeModal()
            } else if ((e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                saveAndClose()
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [closeModal, saveAndClose])

    const onSummarize = async () => {
        if (summarizeLoading) return
        setSummarizeError('')
        setSummarizeLoading(true)
        try {
            const r = await summarizeLink(l.id)
            const txt = r && (r.summary || r.text)
            if (txt) {
                setApiText(txt)
                setSummarizeError('')
            } else {
                setSummarizeError('Empty response from LLM')
            }
        } catch (e) {
            console.error(e)
            setSummarizeError(e?.message || 'Summarize failed')
        } finally {
            setSummarizeLoading(false)
        }
    }

    const [invalidateLoading, setInvalidateLoading] = React.useState(false)
    const [invalidateError, setInvalidateError] = React.useState('')
    const onInvalidate = async () => {
        if (invalidateLoading) return
        setInvalidateError('')
        setInvalidateLoading(true)
        try {
            await apiInvalidateSummary(l.id)
            setApiText('')
        } catch (e) {
            console.error(e)
            setInvalidateError(e?.message || 'Failed to invalidate')
        } finally {
            setInvalidateLoading(false)
        }
    }

    const onAssignNextClick = async () => {
        if (assigningNext || assignedNext) return
        setAssigningNext(true)
        try {
            await apiAssignToNext(l.id)
            setAssignedNext(true)
        } catch (e) {
            console.error(e)
        } finally {
            setAssigningNext(false)
        }
    }

    return (
        <>
            {createPortal(
                <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
                    {/* Opaque backdrop */}
                    <div className="absolute inset-0 tw-modal-backdrop" onClick={closeModal} />

                    {/* Draggable & Resizable window */}
                    <div
                        className="relative flex flex-col tw-modal-window"
                        style={{ top: modalPos.y, left: modalPos.x, width: modalSize.w, height: modalSize.h }}
                    >
                        {/* Header bar (drag handle) */}
                        <div
                            onMouseDown={onHeaderMouseDown}
                            className="cursor-move select-none px-3 py-2 flex items-center justify-between gap-2 tw-modal-header"
                        >
                            <h3 className="text-base font-semibold truncate" title={l.title}>{l.title}</h3>
                            <button aria-label="Close" onClick={closeModal} className="tw-btn tw-btn--sm">&times;</button>
                        </div>

                        {/* Body */}
                        <div className="p-3 overflow-hidden flex-1 min-h-0 flex flex-col tw-modal-surface">
                            <div className="flex-1 min-h-0 overflow-auto tw-panel p-3" ref={fieldsBoxRef}>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium tw-text-muted">Title</label>
                                        <div className="flex items-center gap-2">
                                            {/* Read button shown when there is an AI summary and content exists */}
                                            {Boolean(apiText && l?.content && (l.content + '').trim().length > 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowContent(true)}
                                                    className="tw-btn tw-btn--sm"
                                                    title="Read content"
                                                >
                                                    Read
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={onAssignNextClick}
                                                disabled={assigningNext || assignedNext}
                                                className="tw-btn tw-btn--sm"
                                                title="Add to next…"
                                            >
                                                {assignedNext ? 'In' : (assigningNext ? 'Add…' : 'Add to next TechWatch')}
                                            </button>
                                            <select
                                                className="tw-input"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                title="Status"
                                            >
                                                <option value="KEEP">Keep</option>
                                                <option value="LATER">Later</option>
                                                <option value="REJECT">Reject</option>
                                            </select>
                                        </div>
                                    </div>
                                    <input
                                        className="tw-input w-full"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-xs font-medium tw-text-muted mb-1">URL</label>
                                    <input
                                        className="tw-input w-full"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="block text-xs font-medium tw-text-muted mb-1">Description</label>
                                    <textarea
                                        className="tw-textarea w-full p-2 text-sm"
                                        rows={3}
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                    />
                                </div>

                                {/* IA summarize: show either the button or the summary */}
                                {apiText ? (
                                    <div className="mb-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-xs font-medium tw-text-muted">Texte IA (résultat API)</label>
                                            <button
                                                type="button"
                                                onClick={onInvalidate}
                                                disabled={invalidateLoading}
                                                className="tw-btn tw-btn--sm tw-btn--danger"
                                                title="Invalider le résumé IA"
                                            >
                                                Invalider
                                            </button>
                                        </div>
                                        <textarea
                                            className="tw-textarea w-full p-2 text-sm"
                                            rows={3}
                                            readOnly
                                            value={apiText}
                                        />
                                        {!invalidateLoading && invalidateError && <div className="mt-1"><span className="tw-error">{invalidateError}</span></div>}
                                    </div>
                                ) : (
                                    Boolean(l?.content && (l.content + '').trim().length > 0) && (
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={onSummarize} className="tw-btn" disabled={summarizeLoading}>IA summarize</button>
                                            <button
                                                type="button"
                                                onClick={() => setShowContent(true)}
                                                className="tw-btn"
                                                title="Read content"
                                            >
                                                Read
                                            </button>
                                            {summarizeLoading && <span className="text-sm tw-text-muted">Summarize in progress…</span>}
                                            {!summarizeLoading && summarizeError && <span className="tw-error">{summarizeError}</span>}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        <TagRow linkId={l.id} initialTags={l.tags} className="px-3 py-2" />

                        {/* Footer */}
                        <LinkEditFooter
                            onDelete={async () => { try { await apiDeleteLink(l.id) } catch (e) { console.error(e) } finally { onRequestClose?.() } }}
                            onCancel={() => onRequestClose?.()}
                            onSave={saveAndClose}
                        />

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
            )}
            {showContent && (
                <LinkContentModal
                    title={l?.title}
                    content={l?.content || ''}
                    onRequestClose={() => setShowContent(false)}
                />
            )}
        </>
    )
}
