import React, { useEffect, useState } from 'react'
import TechWatchList from './TechWatchList'
import NewTechWatchComponent from './NewTechWatchComponent'
import TechWatchComponent from './TechWatchComponent'
import { listTechWatches as apiListTechWatches, updateTechWatch as apiUpdateTechWatch } from '../../api/techwatch'
import PageHeader from "../general/PageHeader.jsx";
import Modal from "../common/Modal.jsx";

export default function TechWatchListPage() {
    const formatFrenchDate = (dateStr) => {
        if (!dateStr) return ''
        try {
            const d = new Date(dateStr)
            if (isNaN(d)) return String(dateStr)
            return d.toLocaleDateString('fr-FR')
        } catch (_) {
            return String(dateStr)
        }
    }
    const toInputDate = (dateStr) => {
        if (!dateStr) return ''
        try {
            // Expecting ISO-like input; ensure yyyy-MM-dd
            const d = new Date(dateStr)
            if (isNaN(d)) return String(dateStr)
            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}`
        } catch (_) {
            return ''
        }
    }
    const [techWatches, setTechWatches] = useState([])
    const [openedTechWatch, setOpenedTechWatch] = useState(null)
    const [error, setError] = useState('')
    const [editingStatus, setEditingStatus] = useState(false)
    const [statusDraft, setStatusDraft] = useState('')
    const [editingMax, setEditingMax] = useState(false)
    const [maxDraft, setMaxDraft] = useState('')
    const [editingDate, setEditingDate] = useState(false)
    const [dateDraft, setDateDraft] = useState('')

    const loadTechWatches = async () => {
        try {
            const data = await apiListTechWatches()
            setTechWatches(Array.isArray(data) ? data : [])
            setOpenedTechWatch(prev => {
                if (!prev) return prev
                const found = (Array.isArray(data) ? data : []).find(t => t.id === prev.id)
                return found || null
            })
        } catch (e) {
            console.error(e)
            setTechWatches([])
            setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
        }
    }

    useEffect(() => {
        loadTechWatches()
    }, [])

    const openTechWatchDetails = (tw) => {
        setOpenedTechWatch(prev => (prev && prev.id === tw.id) ? null : tw)
    }

    return (
        <div className="tw-panel p-3 -mt-3">
            <PageHeader title="Tech Watch List" error={error} />

            <NewTechWatchComponent onCreated={loadTechWatches} />

            <TechWatchList
                items={techWatches}
                onOpen={openTechWatchDetails}
            />

            {openedTechWatch && (
                <Modal
                    isOpen={true}
                    onRequestClose={() => setOpenedTechWatch(null)}
                    title={`Minute veille techno du ${formatFrenchDate(openedTechWatch?.date)}`}
                    initialPosition={{ x: 120, y: 80 }}
                    initialSize={{ w: 960, h: 640 }}
                >
                    <div className="tw-panel p-3 -mt-3 h-full overflow-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xl font-semibold" onDoubleClick={() => { setEditingDate(true); setDateDraft(toInputDate(openedTechWatch?.date)); }}>
                                {!editingDate && (
                                    <span>{`${formatFrenchDate(openedTechWatch?.date)}`}</span>
                                )}
                                {editingDate && (
                                    <input
                                        className="tw-input"
                                        type="date"
                                        value={dateDraft}
                                        autoFocus
                                        onChange={async (e) => {
                                            const newVal = e.target.value
                                            setDateDraft(newVal)
                                            if (!newVal) return
                                            try {
                                                await apiUpdateTechWatch(openedTechWatch.id, { date: newVal })
                                                await loadTechWatches()
                                            } catch (err) {
                                                console.error(err)
                                                alert(err.message || "Erreur lors de la mise à jour de la date (peut-être déjà utilisée)")
                                            } finally {
                                                setEditingDate(false)
                                            }
                                        }}
                                        onBlur={() => setEditingDate(false)}
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div onDoubleClick={() => { setEditingMax(true); setMaxDraft(String(openedTechWatch?.maxArticles ?? '')); }}>
                                    {!editingMax && (
                                        <span title="Nombre max d’articles">Max: {openedTechWatch?.maxArticles}</span>
                                    )}
                                    {editingMax && (
                                        <input
                                            className="tw-input w-24 text-right"
                                            type="number"
                                            min={1}
                                            value={maxDraft}
                                            autoFocus
                                            onChange={e => setMaxDraft(e.target.value.replace(/[^0-9]/g, ''))}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const value = parseInt(maxDraft, 10)
                                                    if (!isNaN(value) && value > 0 && value !== openedTechWatch?.maxArticles) {
                                                        try {
                                                            await apiUpdateTechWatch(openedTechWatch.id, { maxArticles: value })
                                                            await loadTechWatches()
                                                        } catch (err) {
                                                            console.error(err)
                                                            alert(err.message || 'Erreur lors de la mise à jour du nombre max d’articles')
                                                        }
                                                    }
                                                    setEditingMax(false)
                                                } else if (e.key === 'Escape') {
                                                    setEditingMax(false)
                                                }
                                            }}
                                            onBlur={() => setEditingMax(false)}
                                        />
                                    )}
                                </div>
                                <div onDoubleClick={() => { setEditingStatus(true); setStatusDraft(openedTechWatch?.status || 'PLANNED'); }}>
                                    {!editingStatus && (
                                        <span className="px-2 py-1 rounded border" title="Status">
                                            {openedTechWatch?.status}
                                        </span>
                                    )}
                                    {editingStatus && (
                                        <select
                                            className="tw-input"
                                            value={statusDraft}
                                            autoFocus
                                            onChange={async (e) => {
                                                const newStatus = e.target.value
                                                setStatusDraft(newStatus)
                                                try {
                                                    await apiUpdateTechWatch(openedTechWatch.id, { status: newStatus })
                                                    await loadTechWatches()
                                                } catch (err) {
                                                    console.error(err)
                                                    alert(err.message || 'Erreur lors de la mise à jour du statut')
                                                } finally {
                                                    setEditingStatus(false)
                                                }
                                            }}
                                            onBlur={() => setEditingStatus(false)}
                                        >
                                            <option value="PLANNED">PLANNED</option>
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                        <TechWatchComponent techWatchId={openedTechWatch.id} date={openedTechWatch.date} />
                    </div>
                </Modal>
            )}
        </div>
    )
}
