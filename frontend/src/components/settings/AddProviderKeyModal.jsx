import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import { createKey as apiCreateKey, updateKey as apiUpdateKey, getKey as apiGetKey } from '../../api/aikeys'

export default function AddProviderKeyModal({ isOpen, onRequestClose, onSaved, provider: providerProp, initialValues }) {
  const [provider, setProvider] = useState(providerProp || 'perplexity')
  const defaults = useMemo(() => ({
    perplexity: { baseUrl: 'https://api.perplexity.ai' },
    mistral: { baseUrl: 'https://api.mistral.ai' },
    openai: { baseUrl: 'https://api.openai.com' },
  }), [])

  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState(defaults[provider]?.baseUrl || '')
  const [apiKey, setApiKey] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setProvider(providerProp || 'perplexity') }, [providerProp])

  useEffect(() => {
    let aborted = false
    async function prefill() {
      if (!isOpen) return
      const iv = initialValues || {}
      const p = (iv.provider || providerProp || 'perplexity').toLowerCase()
      setProvider(p)
      setSaving(false)
      setError('')

      // Prefill from initialValues
      setName(iv.name || '')
      setBaseUrl(iv.baseUrl || defaults[p]?.baseUrl || '')
      setOrganizationId(iv.organizationId || '')
      setProjectId(iv.projectId || '')

      // If editing and apiKey not present in list item, fetch full secret
      if (iv && iv.id && !iv.apiKey) {
        try {
          const full = await apiGetKey(iv.id)
          if (aborted) return
          setApiKey(full.apiKey || '')
          // In case provider/baseUrl/name differ, ensure consistency
          if (full.provider) setProvider(String(full.provider).toLowerCase())
          if (full.name) setName(full.name)
          if (full.baseUrl) setBaseUrl(full.baseUrl)
          if (full.organizationId) setOrganizationId(full.organizationId)
          if (full.projectId) setProjectId(full.projectId)
        } catch (e) {
          if (aborted) return
          setApiKey('')
          setError(e?.message || 'Failed to load secret')
        }
      } else {
        // Create flow or apiKey provided
        setApiKey(iv.apiKey || '')
      }
    }
    prefill()
    return () => { aborted = true }
  }, [isOpen, initialValues, providerProp, defaults])

  useEffect(() => {
    // When provider changes and no initial value provided for baseUrl, set default
    if (!initialValues) {
      setBaseUrl(defaults[provider]?.baseUrl || '')
    }
  }, [provider, initialValues, defaults])

  const isOpenAI = provider === 'openai'
  const canSave = !!provider && !!name && !!baseUrl && !!apiKey && (!isOpenAI || true)

  const onSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    setError('')
    try {
      const payload = { provider, name, baseUrl: baseUrl.trim(), apiKey: apiKey.trim() }
      if (isOpenAI) {
        if (organizationId) payload.organizationId = organizationId.trim()
        if (projectId) payload.projectId = projectId.trim()
      }
      if (initialValues && initialValues.id) {
        await apiUpdateKey(initialValues.id, payload)
      } else {
        await apiCreateKey(payload)
      }
      // Notify other components that the keys list has changed
      try { window.dispatchEvent(new CustomEvent('ai-api-keys:changed')) } catch {}
      try { onSaved && onSaved() } catch {}
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
      title="Add API Key"
      initialSize={{ w: 560, h: isOpenAI ? 480 : 420 }}
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
          <label className="block text-sm mb-1 tw-text-muted">Provider</label>
          <select className="tw-select w-full" value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="perplexity">Perplexity</option>
            <option value="openai">OpenAI</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 tw-text-muted">Nom</label>
          <input value={name} onChange={e => setName(e.target.value)} className="tw-input w-full" />
        </div>
        <div>
          <label className="block text-sm mb-1 tw-text-muted">Base URL</label>
          <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="tw-input w-full" placeholder={defaults[provider]?.baseUrl || ''} />
        </div>
        <div>
          <label className="block text-sm mb-1 tw-text-muted">API Key</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} className="tw-input w-full" type="text" placeholder="" />
        </div>
        {isOpenAI && (
          <>
            <div>
              <label className="block text-sm mb-1 tw-text-muted">Organization Id (optionnel)</label>
              <input value={organizationId} onChange={e => setOrganizationId(e.target.value)} className="tw-input w-full" />
            </div>
            <div>
              <label className="block text-sm mb-1 tw-text-muted">Project Id (optionnel)</label>
              <input value={projectId} onChange={e => setProjectId(e.target.value)} className="tw-input w-full" />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
