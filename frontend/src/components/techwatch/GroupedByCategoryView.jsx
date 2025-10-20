import React, { useEffect, useState } from 'react'
import LinkEditModal from '../links/LinkEditModal'

function GroupedByCategoryView({
  links,
                                   onUpdateStatus,
                                   onAssignNext,
                                   onDelete,
                                   mode,
                                   techWatchId,
  onRemoveFromTechWatch,
  onEdited
}) {
  const [chosenCategory, setChosenCategory] = useState({}) // { [linkId]: tagName | 'Uncategorized' }
  const [draggingLinkId, setDraggingLinkId] = useState(null)
  const [showBottomChooserFor, setShowBottomChooserFor] = useState(null)
  const [editLinkId, setEditLinkId] = useState(null)

  const storageKey = techWatchId ? `mvtCategory:${techWatchId}` : null
  // Load saved categories for this TechWatch
  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setChosenCategory(parsed)
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey])
  // Helper to update and persist
  const updateChosenCategory = (updater) => {
    setChosenCategory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (e) { /* ignore */ }
      }
      return next
    })
  }

  const allTagNames = Array.from(new Set((links || []).flatMap(l => (l.tags || []).map(t => t.name)))).sort((a, b) => a.localeCompare(b))
  const UNCATEGORIZED = 'Uncategorized'

  const getChosenCatFor = (l) => {
    const desired = chosenCategory[l.id]
    const tagNames = (l.tags || []).map(t => t.name)
    if (desired && (desired === UNCATEGORIZED || tagNames.includes(desired))) return desired
    if (tagNames.length > 0) return tagNames[0]
    return UNCATEGORIZED
  }

  // Build groups
  const groups = {}
  allTagNames.forEach(t => { groups[t] = [] })
  groups[UNCATEGORIZED] = []
  for (const l of links || []) {
    const cat = getChosenCatFor(l)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(l)
  }

  const onDragStart = (e, l) => {
    setDraggingLinkId(l.id)
    setShowBottomChooserFor(null)
    const payload = { id: l.id, tags: (l.tags || []).map(t => t.name) }
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragEnd = () => {
    setDraggingLinkId(null)
    setShowBottomChooserFor(null)
  }

  const makeCategoryDroppableProps = (categoryName) => ({
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' },
    onDrop: (e) => {
      try {
        const txt = e.dataTransfer.getData('application/json') || '{}'
        const data = JSON.parse(txt)
        const allowed = Array.isArray(data.tags) && data.tags.includes(categoryName)
        if (allowed) {
          updateChosenCategory(prev => ({ ...prev, [data.id]: categoryName }))
        }
      } catch (err) { /* ignore */ }
      setShowBottomChooserFor(null)
    },
    onDragEnter: () => setShowBottomChooserFor(null)
  })

  const bottomZoneProps = {
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' },
    onDragEnter: () => setShowBottomChooserFor(draggingLinkId),
    onDrop: () => setShowBottomChooserFor(null)
  }

  const isMvt = mode === 'mvt'

  const renderBullet = (l) => (
    <li key={l.id}
        draggable
        onDragStart={(e) => onDragStart(e, l)}
        onDragEnd={onDragEnd}
        onDoubleClick={() => setEditLinkId(l.id)}
        className="py-1 rounded cursor-grab flex items-center">
      {isMvt ? null : <span>- </span>}
      <a href={l.url} target="_blank" rel="noreferrer" onDoubleClick={(e) => e.stopPropagation()}>{l.title}</a>
      {isMvt ? (
        <>
          {l.description ? <span className="ml-1">: {l.description}</span> : null}
          <button
            title="Remove from this TechWatch"
            onClick={() => onRemoveFromTechWatch && techWatchId && onRemoveFromTechWatch(techWatchId, l.id)}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >&times;</button>
        </>
      ) : (
        <>
          <span>[{l.url}]</span>
          {l.description ? <span>: {l.description}</span> : null}
          <span className="ml-auto inline-flex gap-1">
            <button onClick={() => onUpdateStatus(l.id, 'KEEP')}>Keep</button>
            <button onClick={() => onUpdateStatus(l.id, 'LATER')}>Later</button>
            <button onClick={() => onUpdateStatus(l.id, 'REJECT')}>Reject</button>
            <button onClick={() => onAssignNext(l.id)}>Next TW</button>
            <button onClick={() => onDelete(l.id)}>Del</button>
          </span>
        </>
      )}
    </li>
  )

  return (
    <div>
      {Object.keys(groups).filter(k => groups[k].length > 0 || k === UNCATEGORIZED).map((cat) => (
        <section key={cat} className="border border-gray-300 px-3 py-2 mb-3 rounded" {...(cat !== UNCATEGORIZED ? makeCategoryDroppableProps(cat) : {})}>
          <div className="font-bold mb-1">{cat}</div>
          <ul className="m-0 pl-4">
            {groups[cat].map(renderBullet)}
          </ul>
        </section>
      ))}

      {/* Bottom chooser area: appears when dragging and under the last category */}
      <div className="border-2 border-dashed border-gray-400 p-3 text-center text-gray-600" {...bottomZoneProps}>
        {showBottomChooserFor ? (
          (() => {
            const l = (links || []).find(x => x.id === showBottomChooserFor)
            const tagNames = (l?.tags || []).map(t => t.name)
            if (!l || tagNames.length === 0) return <span>Drop here to cancel</span>
            return (
              <div className="inline-flex gap-2 flex-wrap items-center">
                <span>Choose category:</span>
                {tagNames.map(name => (
                  <div key={name}
                       onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                       onDrop={() => { updateChosenCategory(prev => ({ ...prev, [l.id]: name })); setShowBottomChooserFor(null) }}
                       onClick={() => { updateChosenCategory(prev => ({ ...prev, [l.id]: name })); setShowBottomChooserFor(null) }}
                       className="px-2 py-1 border border-indigo-300 bg-indigo-50 rounded-full cursor-pointer">
                    {name}
                  </div>
                ))}
              </div>
            )
          })()
        ) : (
          <span>Drag a link here to choose its category from its tags</span>
        )}
      </div>

      {editLinkId && (
        <LinkEditModal linkId={editLinkId} onRequestClose={() => setEditLinkId(null)} onSaved={onEdited} />
      )}
    </div>
  )
}

export default GroupedByCategoryView
