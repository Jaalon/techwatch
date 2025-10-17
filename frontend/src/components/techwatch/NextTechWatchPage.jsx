import React, { useEffect, useState } from 'react'
import TechWatchComponent from './TechWatchComponent'
import { getActiveTechWatch as apiGetActiveTechWatch } from '../../api/techwatch'

export default function NextTechWatchPage() {
  const [activeTechWatch, setActiveTechWatch] = useState(null)

  const loadActiveTechWatch = async () => {
    try {
      const data = await apiGetActiveTechWatch()
      setActiveTechWatch(data || null)
    } catch (e) {
      console.error(e)
      setActiveTechWatch(null)
    }
  }

  useEffect(() => {
    loadActiveTechWatch()
  }, [])

  return (
    <section className="border border-gray-300 p-4 mb-4 rounded">
      <h2 className="mt-0">Active Tech Watch</h2>
      {activeTechWatch ? (
        <TechWatchComponent techWatchId={activeTechWatch.id} date={activeTechWatch.date} />
      ) : (
        <div className="mb-3">No active TechWatch</div>
      )}
    </section>
  )
}
