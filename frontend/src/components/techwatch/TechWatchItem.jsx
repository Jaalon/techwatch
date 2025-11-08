import React, { useEffect, useState } from 'react'
import { getTechWatchLinks as apiGetTechWatchLinks } from '../../api/techwatch'

function TechWatchItem({ item, onOpen }) {
  const m = item || {}
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadCount = async () => {
      try {
        if (!m?.id) { setCount(0); return }
        const links = await apiGetTechWatchLinks(m.id)
        if (!cancelled) setCount(Array.isArray(links) ? links.length : 0)
      } catch (e) {
        if (!cancelled) setCount(0)
      }
    }
    loadCount()
    return () => { cancelled = true }
  }, [m?.id])

  const max = m?.maxArticles ?? '?'

  return (
    <li
      className="tw-item p-3 text-left flex gap-2 items-center"
      onDoubleClick={() => onOpen && onOpen(m)}
      title="Double-click to open"
    >
      <span className="font-medium">{m.date}</span>
      <span className="px-2 py-0.5 rounded text-xs" title="Articles count">
        {count}/{max}
      </span>
      <span className="text-xs text-gray-600">{m.status}</span>
    </li>
  )
}

export default TechWatchItem
