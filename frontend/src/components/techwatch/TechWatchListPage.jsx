import React, { useEffect, useState } from 'react'
import TechWatchListComponent from './TechWatchListComponent'
import NewTechWatchComponent from './NewTechWatchComponent'
import TechWatchComponent from './TechWatchComponent'
import { listTechWatches as apiListTechWatches, activateTechWatch as apiActivateTechWatch, completeTechWatch as apiCompleteTechWatch } from '../../api/techwatch'
import PageHeader from "../general/PageHeader.jsx";

export default function TechWatchListPage() {
    const [techWatches, setTechWatches] = useState([])
    const [openedTechWatch, setOpenedTechWatch] = useState(null)
    const [error, setError] = useState('')

    const loadTechWatches = async () => {
        try {
            const data = await apiListTechWatches()
            setTechWatches(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
            setTechWatches([])
            setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
        }
    }

    useEffect(() => {
        loadTechWatches()
    }, [])

    const activateTechWatch = async (id) => {
        await apiActivateTechWatch(id)
        await loadTechWatches()
    }

    const completeTechWatch = async (id) => {
        await apiCompleteTechWatch(id)
        await loadTechWatches()
    }

    const openTechWatchDetails = (tw) => {
        setOpenedTechWatch(prev => (prev && prev.id === tw.id) ? null : tw)
    }

    return (
        <div>
            <PageHeader title="Tech Watch List" error={error} />


            <NewTechWatchComponent onCreated={loadTechWatches} />

            <TechWatchListComponent
                items={techWatches}
                onOpen={openTechWatchDetails}
                onActivate={activateTechWatch}
                onComplete={completeTechWatch}
            />

            {openedTechWatch && (
                <section className="border border-gray-300 p-4 mb-4 rounded">
                    <TechWatchComponent techWatchId={openedTechWatch.id} date={openedTechWatch.date} />
                </section>
            )}
        </div>
    )
}
