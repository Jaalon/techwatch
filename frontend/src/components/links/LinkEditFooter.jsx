import React from 'react'

export default function LinkEditFooter({ onDelete, onCancel, onSave }) {
  return (
    <div className="px-3 py-2 tw-modal-footer">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="tw-btn tw-btn--danger" onClick={onDelete}>Delete</button>
        <div className="flex justify-end gap-2 ml-auto">
          <button type="button" className="tw-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="tw-btn" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
