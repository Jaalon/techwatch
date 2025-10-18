import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { createConfig as apiCreateConfig } from '../../api/llm'

export default function AddPerplexityProviderModal({ isOpen, onRequestClose, onSaved }) {
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.perplexity.ai')
  const [apiKey, setApiKey] = useState('')
  const [models] = useState(['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'])
  const [selectedModel, setSelectedModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    // reset form each time it opens
    setName('')
    setBaseUrl('https://api.perplexity.ai')
    setApiKey('')
    setSelectedModel('')
    setSaving(false)
    setError('')
  }, [isOpen])

  const canSave = selectedModel && name && baseUrl && apiKey

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setError('')
    try {
      await apiCreateConfig({ name, baseUrl, apiKey, model: selectedModel })
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
      initialSize={{ w: 560, h: 420 }}
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
          <label className="block text-sm mb-1 tw-text-muted">Base URL</label>
          <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="tw-input w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1 tw-text-muted">API Key</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="tw-input w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1 tw-text-muted">Model</label>
          <select value={selectedModel} onChange={e => { const v = e.target.value; setSelectedModel(v); if (!name) setName(v); }} className="tw-select w-full">
            <option value="">-- Select a model --</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
