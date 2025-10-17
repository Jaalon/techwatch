import React from 'react'
import LinkItem from './LinkItem'

function LinkList({
  links,
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
  return (
    <ul className="list-none p-0 space-y-2">
      {(links || []).map(l => (
        <LinkItem
          key={l.id}
          link={l}
          tagInputs={tagInputs}
          setTagInputs={setTagInputs}
          tagOptions={tagOptions}
          fetchTagOptions={fetchTagOptions}
          onRemoveTag={onRemoveTag}
          onAddTag={onAddTag}
          onUpdateStatus={onUpdateStatus}
          onAssignNext={onAssignNext}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default LinkList
