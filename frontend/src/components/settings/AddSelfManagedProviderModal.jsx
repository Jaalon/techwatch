import React from 'react'
import Modal from '../common/Modal'

export default function AddSelfManagedProviderModal({ isOpen, onRequestClose, initialValues }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title="Add Self-Managed LLM provider"
      initialSize={{ w: 520, h: 240 }}
      draggable={true}
      resizable={false}
      footerContent={<div className="flex justify-end"><button className="tw-btn" onClick={onRequestClose}>Close</button></div>}
    >
      <div className="tw-modal-surface p-2">
        <p className="tw-text-muted">Not Implemented Yet</p>
      </div>
    </Modal>
  )
}
