import React from 'react'

function TechWatchItem({ item, onOpen, onActivate, onComplete }) {
  const m = item
  return (
    <li className="flex gap-2 items-center py-1" onDoubleClick={() => onOpen && onOpen(m)} title="Double-click to open">
      <span>#{m.id} — {m.date} — {m.status}</span>
      <button className="tw-btn tw-btn--sm" onClick={() => onOpen && onOpen(m)}>Open</button>
      <button className="tw-btn tw-btn--sm" onClick={() => onActivate && onActivate(m.id)} disabled={m.status === 'ACTIVE'}>Activate</button>
      <button className="tw-btn tw-btn--sm" onClick={() => onComplete && onComplete(m.id)} disabled={m.status === 'COMPLETED'}>Complete</button>
    </li>
  )
}

export default TechWatchItem
