import React from 'react'
import Modal from './Modal.jsx'

/**
 * Confirmation modal for deletions. Extends the shared Modal component.
 * Requirements:
 * - Message: "Delete <model_name> ?"
 * - Buttons: Yes (red) and No. Closing the modal behaves like No.
 */
export default function DeleteConfirmModal({
  isOpen,
  name,
  onConfirm,
  onRequestClose,
  isBusy = false,
  errorMessage,
}) {
  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        className="tw-btn tw-btn--sm"
        onClick={onRequestClose}
        disabled={isBusy}
      >No</button>
      <button
        type="button"
        className="tw-btn tw-btn--sm tw-btn--danger"
        onClick={onConfirm}
        disabled={isBusy}
        title="Confirm deletion"
      >Yes</button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title={"Confirm deletion"}
      initialSize={{ w: 360, h: 180 }}
      footerContent={footer}
    >
      <div className="space-y-2">
        <p className="m-0">{`Delete ${name} ?`}</p>
        {errorMessage && (
          <div className="tw-error" role="alert">{errorMessage}</div>
        )}
      </div>
    </Modal>
  )
}
