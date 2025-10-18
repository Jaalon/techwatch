import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { createConfig as apiCreateConfig } from '../../api/llm'

export default function AddLlmProviderModal({ isOpen, onRequestClose, onSaved }) {
  const [provider, setProvider] = useState('perplexity')
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [models] = useState(['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'])
  const [selectedModel, setSelectedModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    // reset form each time it opens
    setProvider('perplexity')
    setName('')
    setBaseUrl('')
    setApiKey('')
    setSelectedModel('')
    setSaving(false)
    setError('')
  }, [isOpen])

  const canSave = provider === 'perplexity' && selectedModel && name && baseUrl && apiKey

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
      title="Add LLM configuration"
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
      {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full">
            <option value="docker">docker</option>
            <option value="self-managed">self-managed</option>
            <option value="openAI">openAI</option>
            <option value="perplexity">perplexity</option>
          </select>
        </div>
        {provider === 'perplexity' ? (
          <>
            <div>
              <label className="block text-sm mb-1">Nom</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Base URL</label>
              <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">API Key</label>
              <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1">Model</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full">
                <option value="">-- Select a model --</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">Not yet implemented</div>
        )}
      </div>
    </Modal>
  )
}
