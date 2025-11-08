import React, { useState } from 'react'
import DeleteConfirmModal from '../common/DeleteConfirmModal.jsx'

export default function TechWatchFooter({ onDelete, onClose }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteClick = () => setShowConfirm(true)
  const handleConfirm = () => {
    setShowConfirm(false)
    onDelete && onDelete()
  }
  const handleRequestClose = () => setShowConfirm(false)

  return (
    <div className="px-3 py-2 tw-modal-footer">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="tw-btn tw-btn--danger" onClick={handleDeleteClick}>Delete</button>
        <div className="flex justify-end gap-2 ml-auto">
          <button type="button" className="tw-btn" onClick={onClose}>Close</button>
        </div>
      </div>

      {showConfirm && (
        <DeleteConfirmModal
          isOpen={showConfirm}
          name="this TechWatch"
          onConfirm={handleConfirm}
          onRequestClose={handleRequestClose}
        />
      )}
    </div>
  )
}
