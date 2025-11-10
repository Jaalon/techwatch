import React, { useState, useEffect, useMemo } from 'react'
import Modal from '../common/Modal'
import { createConfig as apiCreateConfig, updateConfig as apiUpdateConfig } from '../../api/llm'

export default function AddPerplexityProviderModal({ isOpen, onRequestClose, onSaved, initialValues, selectedKeyId, selectedKeyName, keys = [] }) {
  const [name, setName] = useState('')
  const [models] = useState(['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'])
  const [selectedModel, setSelectedModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [keyLoading, setKeyLoading] = useState(false)

  const [localKeyId, setLocalKeyId] = useState('')
  const [isEditingKey, setIsEditingKey] = useState(false)
  const localKeyName = useMemo(() => {
    const k = keys.find(x => String(x.id) === String(localKeyId))
    return k?.name || selectedKeyName || ''
  }, [keys, localKeyId, selectedKeyName])

  useEffect(() => {
    if (!isOpen) return
    // reset or prefill form each time it opens
    const iv = initialValues || {}
    setName(iv.name || '')
    setSelectedModel(iv.model || '')
    setSaving(false)
    setError('')
    setKeyLoading(false)
    setIsEditingKey(false)
    setLocalKeyId(String(selectedKeyId || ''))
  }, [isOpen, initialValues, selectedKeyId])

  const canSave = !!selectedModel && !!name && !!(localKeyId || selectedKeyId)

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setError('')
    try {
      const keyId = localKeyId || selectedKeyId
      const payload = { name, aiApiKeyId: Number(keyId), model: selectedModel }
      if (initialValues && initialValues.id) {
        await apiUpdateConfig(initialValues.id, payload)
      } else {
        await apiCreateConfig(payload)
      }
      onSaved?.()
      onRequestClose?.()
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title="Add Perplexity configuration"
      initialSize={{ w: 560, h: 380 }}
      draggable={true}
      resizable={true}
      footerContent={
        <div className="flex justify-end gap-2">
          <button onClick={onRequestClose} className="tw-btn">Cancel</button>
          <button onClick={onSave} disabled={!canSave || saving} className="tw-btn">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {error && <div className="tw-error mb-2">{error}</div>}
      <div className="grid grid-cols-1 gap-3 tw-modal-surface">
        <div>
          <label className="block text-sm mb-1 tw-text-muted">Nom</label>
          <input value={name} onChange={e => setName(e.target.value)} className="tw-input w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1 tw-text-muted">Clé d'API</label>
          {!isEditingKey ? (
            <div
              className="tw-input w-full bg-gray-100 dark:bg-gray-800 cursor-default select-none"
              title="Double-cliquer pour changer"
              onDoubleClick={() => setIsEditingKey(true)}
            >
              {keyLoading ? 'Chargement…' : (localKeyName || '—')}
            </div>
          ) : (
            <select
              className="tw-select w-full"
              value={localKeyId || ''}
              onChange={e => setLocalKeyId(e.target.value)}
              onBlur={() => setIsEditingKey(false)}
            >
              <option value="">-- Choisir une clé --</option>
              {keys.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 tw-text-muted">Modèle</label>
          <select value={selectedModel} onChange={e => { const v = e.target.value; setSelectedModel(v); if (!name) setName(v); }} className="tw-select w-full">
            <option value="">-- Sélectionner un modèle --</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
