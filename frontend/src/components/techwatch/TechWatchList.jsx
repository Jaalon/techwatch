import React from 'react'
import TechWatchItem from './TechWatchItem'

function TechWatchList({ items, onOpen, onActivate, onComplete, max = 5 }) {
  const list = Array.isArray(items) ? items.slice(0, max) : []
  return (
    <div>
      <strong>Recent TechWatch</strong>
      <ul className="list-none p-0 space-y-1">
        {list.map(m => (
          <TechWatchItem key={m.id} item={m} onOpen={onOpen} onActivate={onActivate} onComplete={onComplete} />
        ))}
      </ul>
    </div>
  )
}

export default TechWatchList
