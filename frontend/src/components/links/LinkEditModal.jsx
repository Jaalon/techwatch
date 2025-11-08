import React from 'react'
import { updateLink as apiUpdateLink, deleteLink as apiDeleteLink, assignToNext as apiAssignToNext, invalidateSummary as apiInvalidateSummary, getLink as apiGetLink, getLinkInActiveTechWatch as apiGetLinkInActiveTechWatch } from '../../api/links'
import { summarizeLink } from '../../api/ai'
import TagRow from './TagRow'
import LinkEditFooter from './LinkEditFooter'
import LinkContentModal from './LinkContentModal'
import Modal from '../common/Modal'

export default function LinkEditModal({ linkId, onRequestClose, onSaved }) {
    const [link, setLink] = React.useState({ id: linkId })
    const [loadError, setLoadError] = React.useState('')
    const [invalidateLoading, setInvalidateLoading] = React.useState(false)
    const [invalidateError, setInvalidateError] = React.useState('')
    const [title, setTitle] = React.useState(link.title || '')
    const [url, setUrl] = React.useState(link.url || '')
    const [desc, setDesc] = React.useState(link.description || '')
    const [apiText, setApiText] = React.useState(link.summary || '')
    const [status, setStatus] = React.useState(link.status || '')
    const [assigningNext, setAssigningNext] = React.useState(false)
    const [assignedNext, setAssignedNext] = React.useState(false)
    const [summarizeLoading, setSummarizeLoading] = React.useState(false)
    const [summarizeError, setSummarizeError] = React.useState('')
    const [inActiveTechWatch, setInActiveTechWatch] = React.useState(false)
    const [showContent, setShowContent] = React.useState(false)

    const fieldsBoxRef = React.useRef(null)

    React.useEffect(() => {
        let cancelled = false
        async function load() {
            setLoadError('')
            try {
                const data = await apiGetLink(linkId)
                if (!cancelled) setLink(data || { id: linkId })
            } catch (e) {
                if (!cancelled) setLoadError(e?.message || 'Failed to load link')
            }
        }
        if (linkId != null) load()
        return () => { cancelled = true }
    }, [linkId])

    React.useEffect(() => {
        setTitle(link.title || '')
        setUrl(link.url || '')
        setDesc(link.description || '')
        setApiText(link.summary || '')
        setStatus(link.status || '')
        const alreadyInNext = !!(link && (link.inNextMvt || link.inNext || link.assignedToNext || link.inNextTw || link.inNextTW))
        setAssignedNext(alreadyInNext)
    }, [link && link.id, link && link.title, link && link.url, link && link.description, link && link.summary, link && link.status, link && link.inNextMvt, link && link.inNext, link && link.assignedToNext, link && link.inNextTw, link && link.inNextTW])

    React.useEffect(() => {
        let cancelled = false
        async function loadFlag() {
            try {
                const flag = await apiGetLinkInActiveTechWatch(linkId)
                if (!cancelled) setInActiveTechWatch(!!flag)
            } catch (e) {
                if (!cancelled) setInActiveTechWatch(false)
            }
        }
        if (linkId != null) loadFlag()
        return () => { cancelled = true }
    }, [linkId])

    React.useCallback(async () => {
        try {
            const payload = {}
            if ((title || '') !== (link.title || '')) payload.title = title
            if ((url || '') !== (link.url || '')) payload.url = url
            if ((desc || '') !== (link.description || '')) payload.description = desc
            if ((status || '') !== (link.status || '')) payload.status = status
            if (Object.keys(payload).length > 0) {
                await apiUpdateLink(link.id, payload)
            }
        } catch (e) {
            console.error(e)
        } finally {
            onRequestClose?.()
        }
    }, [title, url, desc, status, onRequestClose, link.title, link.url, link.description, link.status, link.id]);

    const saveAndClose = React.useCallback(async () => {
        try {
            const payload = {}
            if ((title || '') !== (link.title || '')) payload.title = title
            if ((url || '') !== (link.url || '')) payload.url = url
            if ((desc || '') !== (link.description || '')) payload.description = desc
            if ((status || '') !== (link.status || '')) payload.status = status
            if (Object.keys(payload).length > 0) {
                await apiUpdateLink(link.id, payload)
            }
        } catch (e) {
            console.error(e)
        } finally {
            try { onSaved && onSaved() } catch {}
            onRequestClose?.()
        }
    }, [title, url, desc, status, onSaved, onRequestClose, link.title, link.url, link.description, link.status, link.id])

    React.useEffect(() => {
        const onKey = (e) => {
            if ((e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                saveAndClose()
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [saveAndClose])


    const onSummarize = async () => {
        if (summarizeLoading) return
        setSummarizeError('')
        setSummarizeLoading(true)
        try {
            const r = await summarizeLink(link.id)
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

    const onInvalidate = async () => {
        if (invalidateLoading) return
        setInvalidateError('')
        setInvalidateLoading(true)
        try {
            await apiInvalidateSummary(link.id)
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
            await apiAssignToNext(link.id)
            setAssignedNext(true)
        } catch (e) {
            console.error(e)
        } finally {
            setAssigningNext(false)
        }
    }


    return (
        <>
            <Modal
                isOpen={true}
                onRequestClose={saveAndClose}
                title={link?.title}
                initialSize={{ w: 640, h: 600 }}
                resizable={true}
                draggable={true}
                footerContent={
                    <LinkEditFooter
                        onDelete={async () => { try { await apiDeleteLink(link.id) } catch (e) { console.error(e) } finally { try { onSaved && onSaved() } catch {} onRequestClose?.() } }}
                        onCancel={() => onRequestClose?.()}
                        onSave={saveAndClose}
                    />
                }
            >
                <div className="p-3 overflow-hidden flex-1 min-h-0 flex flex-col">
                    {loadError && (
                        <div className="tw-error" role="alert">{loadError}</div>
                    )}

                    <div className="flex-1 min-h-0 overflow-auto tw-panel p-3" ref={fieldsBoxRef}>
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium tw-text-muted">Title</label>
                                <div className="flex items-center gap-2">
                                    {Boolean(apiText && link?.content && (link.content + '').trim().length > 0) && (
                                        <button
                                            type="button"
                                            onClick={() => setShowContent(true)}
                                            className="tw-btn tw-btn--sm"
                                            title="Read content"
                                        >
                                            Read
                                        </button>
                                    )}
                                    {(assignedNext || inActiveTechWatch) && (
                                        <span className="mr-1" title="Already in a TechWatch">&reg;</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onAssignNextClick}
                                        disabled={assigningNext || assignedNext || inActiveTechWatch}
                                        className="tw-btn tw-btn--sm"
                                        title={inActiveTechWatch ? "Already in active TechWatch" : "Add to next…"}
                                    >
                                        {(assigningNext || assignedNext || inActiveTechWatch) ? 'In' : 'Add to next TechWatch'}
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
                            Boolean(link?.content && (link.content + '').trim().length > 0) && (
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

                    <TagRow linkId={link.id} initialTags={link.tags} className="px-3 py-2" />
                </div>
            </Modal>
            {showContent && (
                <LinkContentModal
                    title={link?.title}
                    content={link?.content || ''}
                    onRequestClose={() => setShowContent(false)}
                />
            )}
        </>
    )
}
