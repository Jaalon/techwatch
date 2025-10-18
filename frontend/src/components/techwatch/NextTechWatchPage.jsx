import React, { useEffect, useState } from 'react'
import TechWatchComponent from './TechWatchComponent'
import { getActiveTechWatch as apiGetActiveTechWatch } from '../../api/techwatch'
import PageHeader from "../general/PageHeader.jsx";

export default function NextTechWatchPage() {
    const [activeTechWatch, setActiveTechWatch] = useState(null)
    const [error, setError] = useState('')
    const loadActiveTechWatch = async () => {
        try {
            const data = await apiGetActiveTechWatch()
            setActiveTechWatch(data || null)
        } catch (e) {
            console.error(e)
            setActiveTechWatch(null)
            setError("Failed to load active TechWatch: ")
        }
    }

    useEffect(() => {
        loadActiveTechWatch()
    }, [])

    return (
        <div>
            <PageHeader title="Active Tech Watch" error={error} />
            <section className="border border-gray-300 p-4 mb-4 rounded">

                {activeTechWatch ? (
                    <TechWatchComponent techWatchId={activeTechWatch.id} date={activeTechWatch.date} />
                ) : (
                    <div className="mb-3">No active TechWatch</div>
                )}

            </section>
        </div>
    )
}
