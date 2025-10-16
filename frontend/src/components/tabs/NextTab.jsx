import React from 'react'

function NextTab({ activeTechWatch, techWatches }) {
  const nextPlanned = React.useMemo(() => {
    if (activeTechWatch) return null
    const list = Array.isArray(techWatches) ? techWatches : []
    // Find the earliest non-completed by date
    const upcoming = list
      .filter(tw => tw && tw.status !== 'COMPLETED')
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0]
    return upcoming || null
  }, [activeTechWatch, techWatches])

  return (
    <div>
      <h2 className="mt-0">Next</h2>
      {activeTechWatch ? (
        <div>
          <div><strong>Active TechWatch</strong></div>
          <div>Date: {activeTechWatch.date}</div>
          <div>Status: {activeTechWatch.status}</div>
          <div>Max articles: {activeTechWatch.maxArticles}</div>
        </div>
      ) : nextPlanned ? (
        <div>
          <div><strong>Prochaine veille techno</strong></div>
          <div>Date: {nextPlanned.date}</div>
          <div>Status: {nextPlanned.status}</div>
          <div>Max articles: {nextPlanned.maxArticles}</div>
        </div>
      ) : (
        <div>Aucune veille programmée.</div>
      )}
    </div>
  )
}

export default NextTab
