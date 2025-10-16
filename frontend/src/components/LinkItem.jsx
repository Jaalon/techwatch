import React from 'react'

function LinkItem({
  link,
  tagInputs,
  setTagInputs,
  tagOptions,
  fetchTagOptions,
  onRemoveTag,
  onAddTag,
  onUpdateStatus,
  onAssignNext,
  onDelete
}) {
  const l = link
  const when = l.discoveredAt || l.date
  const whenTxt = when ? new Date(when).toLocaleString() : ''

  return (
    <li className="border border-gray-300 p-3 mb-2 rounded text-left">
      <div className="flex justify-between items-baseline">
        <strong>{l.title}</strong>
        <div className="flex gap-2 items-center">
          <small title="Discovered at">{whenTxt}</small>
          <small>{l.status}</small>
        </div>
      </div>
      <div>
        <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
      </div>
      {l.description && <p>{l.description}</p>}

      {/* Tags section */}
      <div className="my-1">
        <div className="flex gap-2 flex-wrap items-center">
          {(l.tags || []).map(t => (
            <span key={t.id || t.name} className="bg-indigo-50 border border-indigo-300 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
              <span>{t.name}</span>
              <button title="Remove tag" onClick={() => onRemoveTag(l.id, t.name)} className="ml-1 text-indigo-600 hover:text-indigo-800">&times;</button>
            </span>
          ))}
          <div className="inline-flex gap-1 items-center">
            <input
              list={`tag-options-${l.id}`}
              placeholder="Add tag..."
              value={tagInputs[l.id] || ''}
              onChange={async e => { const v = e.target.value; setTagInputs(prev => ({ ...prev, [l.id]: v })); await fetchTagOptions(l.id, v) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddTag(l.id, (tagInputs[l.id] || '').trim()) } }}
              className="min-w-[10rem]"
            />
            <datalist id={`tag-options-${l.id}`}>
              {(tagOptions[l.id] || []).map(opt => (
                <option key={opt.id} value={opt.name} />
              ))}
            </datalist>
            <button onClick={() => onAddTag(l.id, (tagInputs[l.id] || '').trim())}>Add</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onUpdateStatus(l.id, 'KEEP')}>Keep</button>
        <button onClick={() => onUpdateStatus(l.id, 'LATER')}>Later</button>
        <button onClick={() => onUpdateStatus(l.id, 'REJECT')}>Reject</button>
        <button onClick={() => onAssignNext(l.id)}>Add to next TechWatch</button>
        <button onClick={() => onDelete(l.id)} className="ml-auto">Delete</button>
      </div>
    </li>
  )
}

export default LinkItem
