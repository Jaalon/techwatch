import React from 'react'

function TechWatchItem({ item, onOpen, onActivate, onComplete }) {
  const m = item
  return (
    <li className="flex gap-2 items-center py-1">
      <span>#{m.id} — {m.date} — {m.status}</span>
      <button onClick={() => onOpen && onOpen(m)}>Open</button>
      <button onClick={() => onActivate && onActivate(m.id)} disabled={m.status === 'ACTIVE'}>Activate</button>
      <button onClick={() => onComplete && onComplete(m.id)} disabled={m.status === 'COMPLETED'}>Complete</button>
    </li>
  )
}

export default TechWatchItem
