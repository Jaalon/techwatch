import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import { createConfig as apiCreateConfig, listMistralModels as apiListMistralModels } from '../../api/llm'
import { getKey as apiGetKey } from '../../api/aikeys'

/**
 * Unified modal to add an LLM model configuration.
 *
 * Flow:
 * - Step 1: select an existing API key (provider determined from key.provider)
 * - Step 2: show the provider-specific form inline (Perplexity, Mistral, OpenAI placeholder)
 *
 * Title changes dynamically:
 * - No key selected: "Add Model"
 * - Perplexity: "Add Perplexity Model"
 * - Mistral: "Add Mistral Model"
 * - OpenAI: "Add OpenAI model"
 */
export default function AddModelModal({ isOpen, onRequestClose, onSaved, keys = [] }) {
  const [selectedKeyId, setSelectedKeyId] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const [provider, setProvider] = useState('')

  // Common states
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Resolved key (full, including apiKey)
  const [resolvedKey, setResolvedKey] = useState(null)
  const [keyLoading, setKeyLoading] = useState(false)

  // Perplexity specific
  const perplexityModels = useMemo(() => ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'], [])
  const [ppxModel, setPpxModel] = useState('')

  // Mistral specific
  const [mistralModels, setMistralModels] = useState([])
  const [mistralModelsLoading, setMistralModelsLoading] = useState(false)
  const [mistralModelsError, setMistralModelsError] = useState('')
  const [mistralModelId, setMistralModelId] = useState('')

  const resetAll = () => {
    setSelectedKeyId('')
    setSelectedKey(null)
    setProvider('')
    setName('')
    setSaving(false)
    setError('')
    setResolvedKey(null)
    setKeyLoading(false)
    setPpxModel('')
    setMistralModels([])
    setMistralModelsLoading(false)
    setMistralModelsError('')
    setMistralModelId('')
  }

  useEffect(() => {
    if (!isOpen) return
    // Reset form on open
    resetAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Resolve full key when selection changes
  useEffect(() => {
    const k = keys.find(x => String(x.id) === String(selectedKeyId))
    setSelectedKey(k || null)
    setProvider((k?.provider || '').toLowerCase())

    const fetchFull = async () => {
      if (!selectedKeyId) { setResolvedKey(null); return }
      try {
        setKeyLoading(true)
        const full = await apiGetKey(selectedKeyId)
        setResolvedKey(full || null)
      } catch (e) {
        console.error(e)
        setResolvedKey(null)
      } finally {
        setKeyLoading(false)
      }
    }
    fetchFull()
  }, [selectedKeyId, keys])

  // If a key gets deleted while this modal is open and it was selected,
  // clear the selection and reset the form to avoid stale state.
  useEffect(() => {
    if (!isOpen) return
    if (selectedKeyId && !keys.find(x => String(x.id) === String(selectedKeyId))) {
      resetAll()
    }
  }, [keys, selectedKeyId, isOpen])

  // When provider is Mistral and we have baseUrl/apiKey, try to fetch models
  const stripV1 = (url) => {
    if (!url) return ''
    let u = String(url).trim()
    while (u.endsWith('/')) u = u.slice(0, -1)
    if (u.toLowerCase().endsWith('/v1/models')) u = u.slice(0, -7)
    if (u.toLowerCase().endsWith('/v1')) { u = u.slice(0, -3); while (u.endsWith('/')) u = u.slice(0, -1) }
    return u
  }

  useEffect(() => {
    if (provider !== 'mistral') return
    const canFetch = !!selectedKeyId
    if (!canFetch) return
    let aborted = false
    const load = async () => {
      try {
        setMistralModelsLoading(true)
        setMistralModelsError('')
        const data = await apiListMistralModels(Number(selectedKeyId))
        if (aborted) return
        const items = Array.isArray(data) ? data : []
        setMistralModels(items)
        if (items.length === 1) {
          const only = items[0]
          setMistralModelId(only.id || '')
          if (!name) setName(only.name || only.id || '')
        }
      } catch (e) {
        if (aborted) return
        setMistralModels([])
        setMistralModelId('')
        setMistralModelsError(e?.message || 'Failed to load models')
      } finally {
        if (!aborted) setMistralModelsLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [provider, selectedKeyId, name])

  const title = useMemo(() => {
    if (!selectedKeyId) return 'Add Model'
    const p = (provider || '').toLowerCase()
    if (p === 'mistral') return 'Add Mistral Model'
    if (p === 'openai') return 'Add OpenAI model'
    if (p === 'perplexity') return 'Add Perplexity Model'
    return 'Add Model'
  }, [selectedKeyId, provider])

  // Save handlers
  const onSave = async () => {
    try {
      setSaving(true)
      setError('')
      const p = (provider || '').toLowerCase()
      if (p === 'perplexity') {
        if (!selectedKeyId || !ppxModel || !name) {
          setError('Veuillez sélectionner une clé, un modèle et renseigner le nom.')
          setSaving(false)
          return
        }
        const payload = { name, aiApiKeyId: Number(selectedKeyId), model: ppxModel }
        await apiCreateConfig(payload)
      } else if (p === 'mistral') {
        if (!selectedKeyId || !mistralModelId || !name) {
          setError('Veuillez sélectionner une clé, un modèle et renseigner le nom.')
          setSaving(false)
          return
        }
        const payload = { name, aiApiKeyId: Number(selectedKeyId), model: mistralModelId }
        await apiCreateConfig(payload)
      } else if (p === 'openai') {
        setError('OpenAI provider is not implemented yet.')
        setSaving(false)
        return
      } else {
        setError('Sélectionnez d\'abord une clé valide.')
        setSaving(false)
        return
      }
      try { onSaved && onSaved() } catch {}
      onRequestClose?.()
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const canSave = useMemo(() => {
    const p = (provider || '').toLowerCase()
    if (p === 'perplexity') return !!selectedKeyId && !!ppxModel && !!name
    if (p === 'mistral') return !!selectedKeyId && !!mistralModelId && !!name
    if (p === 'openai') return false
    return false
  }, [provider, selectedKeyId, ppxModel, name, mistralModelId])

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title={title}
      initialSize={{ w: 640, h: 520 }}
      draggable={true}
      resizable={true}
      footerContent={
        <div className="flex justify-end gap-2">
          <button onClick={onRequestClose} className="tw-btn" disabled={saving}>Cancel</button>
          <button onClick={onSave} className="tw-btn" disabled={!canSave || saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }
    >
      {error && <div className="tw-error mb-2">{error}</div>}

      {/* Step 1: Key selection */}
      <div className="mb-3">
        <label className="text-sm tw-text-muted mr-2" htmlFor="add-model-key-select">API Key</label>
        <select
          id="add-model-key-select"
          className="tw-select"
          value={selectedKeyId}
          onChange={e => setSelectedKeyId(e.target.value)}
        >
          <option value="">-- Select a key --</option>
          {keys.map(k => (
            <option key={k.id} value={k.id}>{k.name} [{k.provider}]</option>
          ))}
        </select>
        {keyLoading && <span className="ml-2 text-xs tw-text-muted">Loading key…</span>}
        {(!keyLoading && keys.length === 0) && <span className="ml-2 text-xs tw-text-muted">Créez d'abord une clé dans "AI API Keys".</span>}
      </div>

      {/* Step 2: Provider-specific form */}
      {provider === 'perplexity' && (
        <div className="tw-modal-surface p-2">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1 tw-text-muted">Nom</label>
              <input className="tw-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="My Perplexity" />
            </div>
            <div>
              <label className="block text-sm mb-1 tw-text-muted">Model</label>
              <select className="tw-select w-full" value={ppxModel} onChange={e => { const v = e.target.value; setPpxModel(v); if (!name) setName(v) }}>
                <option value="">-- Select a model --</option>
                {perplexityModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {!!resolvedKey && (
              <div className="text-xs tw-text-muted">
                Using key: <strong>{selectedKey?.name}</strong> • Base URL: {resolvedKey.baseUrl}
              </div>
            )}
          </div>
        </div>
      )}

      {provider === 'mistral' && (
        <div className="tw-modal-surface p-2">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="tw-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="My Mistral" />
            </div>
            {!!resolvedKey && (
              <div className="text-xs tw-text-muted">
                Using key: <strong>{selectedKey?.name}</strong> • Base URL: {stripV1(resolvedKey.baseUrl)}
              </div>
            )}
            {!!resolvedKey ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm">Model</label>
                  {mistralModelsLoading && <span className="text-xs tw-text-muted">Loading…</span>}
                </div>
                {mistralModelsError && <div className="tw-error mb-2">{mistralModelsError}</div>}
                {mistralModels.length > 0 ? (
                  <select
                    className="tw-select w-full"
                    value={mistralModelId}
                    onChange={e => {
                      const id = e.target.value
                      setMistralModelId(id)
                      if (!name) {
                        const m = mistralModels.find(x => String(x.id) === String(id))
                        const display = (m && (m.name || m.id)) || id
                        setName(display)
                      }
                    }}
                  >
                    <option value="">-- Select a model --</option>
                    {mistralModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))}
                  </select>
                ) : (!mistralModelsLoading && !mistralModelsError ? (
                  <div className="tw-text-muted text-sm">Sélectionnez une clé valide pour charger les modèles.</div>
                ) : null)}
              </div>
            ) : (
              <div className="tw-text-muted text-sm">Sélectionnez d'abord une clé pour charger les modèles.</div>
            )}
          </div>
        </div>
      )}

      {provider === 'openai' && (
        <div className="tw-modal-surface p-2">
          <p className="tw-text-muted">OpenAI provider not implemented yet.</p>
        </div>
      )}

      {!selectedKeyId && (
        <div className="tw-text-muted text-sm">Sélectionnez d'abord une clé pour continuer.</div>
      )}
    </Modal>
  )
}
