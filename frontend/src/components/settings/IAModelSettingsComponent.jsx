import React, { useEffect, useState } from 'react'
import { listConfigs as apiListConfigs, setDefaultConfig as apiSetDefaultConfig, deleteConfig as apiDeleteConfig } from '../../api/llm'
import { listKeys as apiListKeys } from '../../api/aikeys'
import AddPerplexityProviderModal from './AddPerplexityProviderModal.jsx'
import AddDockerProviderModal from './AddDockerProviderModal.jsx'
import AddSelfManagedProviderModal from './AddSelfManagedProviderModal.jsx'
import AddOpenAiProviderModal from './AddOpenAiProviderModal.jsx'
import AddMistralProviderModal from './AddMistralProviderModal.jsx'
import DeleteConfirmModal from '../common/DeleteConfirmModal.jsx'
import AddModelModal from './AddModelModal.jsx'

export default function IAModelSettingsComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAddModelModal, setShowAddModelModal] = useState(false)
  const [provider, setProvider] = useState('perplexity')
  const [initialValues, setInitialValues] = useState(null)

  const [configs, setConfigs] = useState([])

  // AI Keys handling
  const [keys, setKeys] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState('')

  // Delete modal state
  const [showDelete, setShowDelete] = useState(false)
  const [toDelete, setToDelete] = useState({ id: null, name: '' })
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadConfigs = async () => {
    try {
      const data = await apiListConfigs()
      setConfigs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setConfigs([])
    }
  }

  const loadKeys = async () => {
    try {
      const data = await apiListKeys()
      const arr = Array.isArray(data) ? data : []
      setKeys(arr)
      // if none selected, preselect first
      if (!selectedKeyId && arr.length > 0) {
        setSelectedKeyId(String(arr[0].id))
        setProvider(arr[0].provider || 'perplexity')
      }
    } catch (e) {
      console.error(e)
      setKeys([])
    } finally {
    }
  }

  useEffect(() => { loadConfigs(); loadKeys() }, [])

  // Refresh keys list when a new API key is created/updated elsewhere (e.g., AddProviderKeyModal)
  useEffect(() => {
    const onKeysChanged = () => { loadKeys() }
    window.addEventListener('ai-api-keys:changed', onKeysChanged)
    return () => { window.removeEventListener('ai-api-keys:changed', onKeysChanged) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeModal = () => { setShowModal(false); setInitialValues(null) }

  const setDefault = async (id) => {
    try {
      await apiSetDefaultConfig(id)
      await loadConfigs()
    } catch (e) {
      console.error(e)
    }
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
      await apiDeleteConfig(toDelete.id)
      closeDeleteModal()
      await loadConfigs()
    } catch (e) {
      console.error(e)
      const msg = typeof e?.message === 'string' ? e.message : 'Suppression impossible'
      setDeleteError(msg)
      setDeleting(false)
    }
  }

  const inferProviderFromConfig = (c) => {
    const key = keys.find(k => String(k.id) === String(c?.aiApiKeyId))
    if (key?.provider) return String(key.provider).toLowerCase()
    const model = String(c?.model || '').toLowerCase()
    if (model.startsWith('sonar')) return 'perplexity'
    if (model.startsWith('mistral')) return 'mistral'
    return provider // fallback to current selection
  }

  // Find the API key name matching this config by id
  const findKeyNameForConfig = (c) => {
    try {
      const match = keys.find(k => String(k.id) === String(c?.aiApiKeyId))
      return match?.name || ''
    } catch {
      return ''
    }
  }

  const handleConfigDoubleClick = (c) => {
    if (!c) return
    const inferred = inferProviderFromConfig(c)
    setProvider(inferred)
    // preselect the API key used by this config
    if (c.aiApiKeyId) setSelectedKeyId(String(c.aiApiKeyId))
    const iv = { id: c.id, name: c.name, model: c.model }
    setInitialValues(iv)
    setShowModal(true)
  }

  return (
    <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-controls="ia-api-config-panel"
        className="w-full text-left tw-collapsible-header p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
        style={{ border: 'none' }}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>▶</span>
        <strong>IA API Configuration</strong>
      </button>

      {isOpen && (
        <div
          id="ia-api-config-panel"
          role="region"
          aria-label="IA API Configuration"
          className="p-[12px] px-[14px] tw-modal-surface"
        >
          <p className="mt-0">Gérez les configurations LLM.</p>

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddModelModal(true)} className="tw-btn tw-btn--sm">Add LLM</button>
            </div>
          </div>

          {configs.length > 0 ? (
            <ul className="space-y-2">
              {configs.map(c => (
                <li key={c.id} className="flex items-center gap-3 tw-panel p-2" onDoubleClick={() => handleConfigDoubleClick(c)} title="Double-cliquer pour modifier/dupliquer">
                  <div className="flex-1">
                    <div className="font-medium">{c.name} {c.isDefault && <span className="ml-2 text-xs text-green-600">(default)</span>}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{findKeyNameForConfig(c) || '\u00A0'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="tw-btn tw-btn--sm"
                      onClick={() => setDefault(c.id)}
                      disabled={c.isDefault}
                      title={c.isDefault ? 'Déjà par défaut' : 'Définir par défaut'}
                    >Set default</button>
                    <button
                      className="tw-btn tw-btn--sm tw-btn--danger"
                      onClick={() => openDeleteModal(c.id, c.name)}
                      title="Supprimer"
                      aria-label={`Supprimer ${c.name}`}
                    >&times;</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm tw-text-muted">Aucune configuration enregistrée.</div>
          )}
        </div>
      )}

      {/* Unified Add Model modal */}
      {showAddModelModal && (
        <AddModelModal
          isOpen={showAddModelModal}
          onRequestClose={() => setShowAddModelModal(false)}
          onSaved={loadConfigs}
          keys={keys}
        />
      )}

      {/* Edit/duplicate flow (double-click) keeps provider-specific modals for now */}
      {showModal && provider === 'perplexity' && (
        <AddPerplexityProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          onSaved={loadConfigs}
          initialValues={initialValues}
          selectedKeyId={selectedKeyId}
          selectedKeyName={(keys.find(k => String(k.id) === String(selectedKeyId))?.name) || ''}
          keys={keys}
        />
      )}
      {showModal && provider === 'docker' && (
        <AddDockerProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          initialValues={initialValues}
        />
      )}
      {showModal && provider === 'self-managed' && (
        <AddSelfManagedProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          initialValues={initialValues}
        />
      )}
      {showModal && provider === 'openai' && (
        <AddOpenAiProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          initialValues={initialValues}
        />
      )}
      {showModal && provider === 'mistral' && (
        <AddMistralProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          onSaved={loadConfigs}
          initialValues={initialValues}
          selectedKeyId={selectedKeyId}
          selectedKeyName={(keys.find(k => String(k.id) === String(selectedKeyId))?.name) || ''}
          keys={keys}
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
        />)
      }
    </section>
  )
}
