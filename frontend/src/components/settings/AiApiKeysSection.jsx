import React, { useEffect, useState } from 'react'
import AddProviderKeyModal from './AddProviderKeyModal.jsx'
import { listKeys as apiListKeys, deleteKey as apiDeleteKey } from '../../api/aikeys'
import DeleteConfirmModal from '../common/DeleteConfirmModal.jsx'

export default function AiApiKeysSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState('perplexity')
  const [showModal, setShowModal] = useState(false)
  const [initialValues, setInitialValues] = useState(null)

  const [keys, setKeys] = useState([])

  const [showDelete, setShowDelete] = useState(false)
  const [toDelete, setToDelete] = useState({ id: null, name: '' })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = async () => {
    try {
      const data = await apiListKeys()
      setKeys(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setKeys([])
    }
  }
  useEffect(() => { load() }, [])

  const openModal = () => { setInitialValues(null); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setInitialValues(null) }

  const handleDoubleClick = (k) => {
    if (!k) return
    setProvider(k.provider || 'perplexity')
    setInitialValues(k)
    setShowModal(true)
  }

  const openDeleteModal = (id, name) => {
    setToDelete({ id, name })
    setDeleteError('')
    setDeleting(false)
    setShowDelete(true)
  }
  const closeDeleteModal = () => {
    setShowDelete(false)
    setToDelete({ id: null, name: '' })
    setDeleteError('')
    setDeleting(false)
  }
  const confirmDelete = async () => {
    if (!toDelete.id) return
    setDeleting(true)
    setDeleteError('')
    try {
      await apiDeleteKey(toDelete.id)
      // Notify other components (e.g., IA Model settings) that the keys list has changed
      try { window.dispatchEvent(new CustomEvent('ai-api-keys:changed')) } catch {}
      closeDeleteModal()
      await load()
    } catch (e) {
      console.error(e)
      const msg = typeof e?.message === 'string' ? e.message : 'Suppression impossible'
      setDeleteError(msg)
      setDeleting(false)
    }
  }

  return (
    <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-controls="ai-api-keys-panel"
        className="w-full text-left tw-collapsible-header p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
        style={{ border: 'none' }}
      >
        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        <strong>AI API Keys</strong>
      </button>

      {isOpen && (
        <div id="ai-api-keys-panel" role="region" aria-label="AI API Keys" className="p-[12px] px-[14px] tw-modal-surface">
          <p className="mt-0">Définissez des clés d'API réutilisables pour d'autres sessions.</p>

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm tw-text-muted" htmlFor="provider-select-keys">Type</label>
              <select id="provider-select-keys" className="tw-select" value={provider} onChange={e => setProvider(e.target.value)}>
                <option value="perplexity">Perplexity</option>
                <option value="openai">OpenAI</option>
                <option value="mistral">Mistral</option>
              </select>
              <button onClick={openModal} className="tw-btn tw-btn--sm">Add API Key</button>
            </div>
          </div>

          {keys.length > 0 ? (
            <ul className="space-y-2">
              {keys.map(k => (
                <li key={k.id} className="flex items-center gap-3 tw-panel p-2" onDoubleClick={() => handleDoubleClick(k)} title="Double-cliquer pour modifier">
                  <div className="flex-1">
                    <div className="font-medium">{k.name} <span className="ml-2 text-xs tw-text-muted">[{k.provider}]</span></div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{k.baseUrl} • {k.keyPreview || ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="tw-btn tw-btn--sm tw-btn--danger" onClick={() => openDeleteModal(k.id, k.name)} title="Supprimer" aria-label={`Supprimer ${k.name}`}>&times;</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm tw-text-muted">Aucune clé enregistrée.</div>
          )}
        </div>
      )}

      {showModal && (
        <AddProviderKeyModal
          isOpen={showModal}
          onRequestClose={closeModal}
          onSaved={load}
          provider={provider}
          initialValues={initialValues}
        />
      )}

      {showDelete && (
        <DeleteConfirmModal
          isOpen={showDelete}
          name={toDelete.name}
          onConfirm={confirmDelete}
          onRequestClose={closeDeleteModal}
          isBusy={deleting}
          errorMessage={deleteError}
        />
      )}
    </section>
  )
}
