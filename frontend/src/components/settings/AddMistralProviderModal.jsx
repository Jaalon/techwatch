import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { listMistralModels as apiListMistralModels, createConfig as apiCreateConfig, updateConfig as apiUpdateConfig } from '../../api/llm'

export default function AddMistralProviderModal({ isOpen, onRequestClose, onSaved, initialValues }) {
  // Normalize a Mistral base URL so that UI never shows '/v1' and fetch/save logic can append it exactly once
  const stripV1 = (url) => {
    if (!url) return ''
    let u = String(url).trim()
    // remove whitespace and trailing slashes first
    while (u.endsWith('/')) u = u.slice(0, -1)
    // If user pasted endpoint variants, collapse to root without /v1
    if (u.toLowerCase().endsWith('/v1/models')) {
      u = u.slice(0, -7) // drop '/models' to keep '/v1'
    }
    if (u.toLowerCase().endsWith('/v1')) {
      u = u.slice(0, -3) // drop '/v1'
      while (u.endsWith('/')) u = u.slice(0, -1) // ensure no trailing slash
    }
    return u
  }
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.mistral.ai')
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState([]) // from Mistral: array of objects with id,name
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const iv = initialValues || {}
    setName(iv.name || '')
    setBaseUrl(stripV1(iv.baseUrl) || 'https://api.mistral.ai')
    setApiKey(iv.apiKey || '')
    setModels([])
    setSelectedModelId(iv.model || '')
    setModelsError('')
    setModelsLoading(false)
    setSaving(false)
    setSaveError('')
  }, [isOpen, initialValues])

  useEffect(() => {
    const canFetch = !!baseUrl && !!apiKey
    if (!isOpen || !canFetch) return
    let aborted = false
    const fetchModels = async () => {
      try {
        setModelsLoading(true)
        setModelsError('')
        const data = await apiListMistralModels(stripV1(baseUrl), apiKey)
        if (aborted) return
        // data is the raw Mistral "data" array with id/name/etc
        const items = Array.isArray(data) ? data : []
        setModels(items)
        // if only one model, preselect it and optionally fill name
        if (items.length === 1) {
          const only = items[0]
          setSelectedModelId(only.id || '')
          if (!name) setName(only.name || only.id || '')
        }
      } catch (e) {
        if (aborted) return
        setModels([])
        setSelectedModelId('')
        setModelsError(e?.message || 'Failed to load models')
      } finally {
        if (!aborted) setModelsLoading(false)
      }
    }
    fetchModels()
    return () => { aborted = true }
  }, [isOpen, baseUrl, apiKey])

  const canSave = !!name && !!baseUrl && !!apiKey && !!selectedModelId

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setSaveError('')
    try {
      // Ensure Mistral base URL is stored with '/v1' appended exactly once
      let urlToSave = (baseUrl || '').trim()
      if (urlToSave) {
        // Remove trailing slashes
        while (urlToSave.endsWith('/')) urlToSave = urlToSave.slice(0, -1)
        // If user pasted an endpoint like /v1/models, keep only /v1
        if (urlToSave.endsWith('/v1/models')) {
          urlToSave = urlToSave.slice(0, -7) // remove '/models' to keep '/v1'
        }
        // Append '/v1' if not already present
        if (!urlToSave.endsWith('/v1')) {
          urlToSave = urlToSave + '/v1'
        }
      }
      const payload = { name, baseUrl: urlToSave, apiKey, model: selectedModelId }
      if (initialValues && initialValues.id) {
        await apiUpdateConfig(initialValues.id, payload)
      } else {
        await apiCreateConfig(payload)
      }
      try { onSaved && onSaved() } catch {}
      onRequestClose?.()
    } catch (e) {
      setSaveError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title="Add Mistral provider"
      initialSize={{ w: 600, h: 420 }}
      draggable={true}
      resizable={false}
      footerContent={
        <div className="flex justify-end gap-2">
          <button className="tw-btn" onClick={onRequestClose} disabled={saving}>Cancel</button>
          <button className="tw-btn" onClick={onSave} disabled={!canSave || saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }
    >
      <div className="tw-modal-surface p-3">
        {saveError && <div className="tw-error mb-2">{saveError}</div>}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="tw-input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="My Mistral" />
          </div>
          <div>
            <label className="block text-sm mb-1">API URL</label>
            <input className="tw-input w-full" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.mistral.ai" />
          </div>
          <div>
            <label className="block text-sm mb-1">API Key</label>
            <input className="tw-input w-full" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>

          {(!!baseUrl && !!apiKey) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm">Model</label>
                {modelsLoading && <span className="text-xs tw-text-muted">Loading…</span>}
              </div>
              {modelsError && <div className="tw-error mb-2">{modelsError}</div>}
              {models.length > 0 ? (
                <select
                  className="tw-select w-full"
                  value={selectedModelId}
                  onChange={e => {
                    const id = e.target.value
                    setSelectedModelId(id)
                    if (!name) {
                      const m = models.find(x => String(x.id) === String(id))
                      const display = (m && (m.name || m.id)) || id
                      setName(display)
                    }
                  }}
                >
                  <option value="">-- Select a model --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.id}</option>
                  ))}
                </select>
              ) : (!modelsLoading && !modelsError ? (
                <div className="tw-text-muted text-sm">Enter a valid URL and API key to load models.</div>
              ) : null)}
            </div>
          )}

        </div>
      </div>
    </Modal>
  )
}
