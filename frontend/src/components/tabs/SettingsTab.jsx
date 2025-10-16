import React, { useEffect, useState } from 'react'
import { listConfigs as apiListConfigs, createConfig as apiCreateConfig, setDefaultConfig as apiSetDefaultConfig } from '../../api/llm'
import { getSummarizeInstruction, saveSummarizeInstruction } from '../../api/instructions'

function SettingsTab() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  // Prompt directives section state
  const [dirOpen, setDirOpen] = useState(false)
  const [summarizeText, setSummarizeText] = useState('')
  const [dirLoading, setDirLoading] = useState(false)
  const [dirSaving, setDirSaving] = useState(false)
  const [dirError, setDirError] = useState('')
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState(['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'])
  const [selectedModel, setSelectedModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState([])
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('perplexity')

  const resetForm = () => {
    setName('')
    setBaseUrl('')
    setApiKey('')
    setSelectedModel('')
    setSaving(false)
    setError('')
  }

  const loadConfigs = async () => {
    try {
      const data = await apiListConfigs()
      setConfigs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setConfigs([])
    }
  }

  useEffect(() => { loadConfigs() }, [])

  const openModal = () => { resetForm(); setShowModal(true) }
  const closeModal = () => { setShowModal(false); }


  const canSave = provider === 'perplexity' && selectedModel && name && baseUrl && apiKey

  const onSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await apiCreateConfig({ name, baseUrl, apiKey, model: selectedModel })
      setShowModal(false)
      await loadConfigs()
    } catch (e) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (id) => {
    try {
      await apiSetDefaultConfig(id)
      await loadConfigs()
    } catch (e) {
      console.error(e)
    }
  }

  // Load summarize text when opening the section the first time
  useEffect(() => {
    const load = async () => {
      setDirLoading(true)
      setDirError('')
      try {
        const txt = await getSummarizeInstruction()
        setSummarizeText(txt || '')
      } catch (e) {
        setDirError(e?.message || 'Failed to load')
      } finally {
        setDirLoading(false)
      }
    }
    if (dirOpen && !summarizeText) {
      load()
    }
  }, [dirOpen])

  const onSaveDirectives = async () => {
    setDirSaving(true)
    setDirError('')
    try {
      const saved = await saveSummarizeInstruction(summarizeText)
      setSummarizeText(saved)
    } catch (e) {
      setDirError(e?.message || 'Save failed')
    } finally {
      setDirSaving(false)
    }
  }

  return (
    <div>
      <h2 className="mt-0">Settings</h2>

      <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          aria-expanded={isOpen}
          aria-controls="ia-api-config-panel"
          className="w-full text-left bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
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
            className="p-[12px] px-[14px] bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="mt-0">Gérez les configurations LLM.</p>
              <button onClick={openModal} className="px-3 py-1 border rounded">Add LLM</button>
            </div>

            {configs.length > 0 ? (
              <ul className="space-y-2">
                {configs.map(c => (
                  <li key={c.id} className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded p-2">
                    <div className="flex-1">
                      <div className="font-medium">{c.name} {c.isDefault && <span className="ml-2 text-xs text-green-600">(default)</span>}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{c.model} • {c.baseUrl}</div>
                    </div>
                    <button
                      className="text-sm px-2 py-1 border rounded"
                      onClick={() => setDefault(c.id)}
                      disabled={c.isDefault}
                      title={c.isDefault ? 'Déjà par défaut' : 'Définir par défaut'}
                    >Set default</button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-600">Aucune configuration enregistrée.</div>
            )}
          </div>
        )}
      </section>

      <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setDirOpen(o => !o)}
          aria-expanded={dirOpen}
          aria-controls="prompt-directives-panel"
          className="w-full text-left bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
          style={{ border: 'none' }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: dirOpen ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>▶</span>
          <strong>Prompt directives</strong>
        </button>
        {dirOpen && (
          <div
            id="prompt-directives-panel"
            role="region"
            aria-label="Prompt directives"
            className="p-[12px] px-[14px] bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          >
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">Define default instructions used when generating summaries.</div>
            {dirError && <div className="mb-2 text-red-600 text-sm">{dirError}</div>}
            <label className="block text-sm mb-1" htmlFor="summarize-instructions">Summarize instructions</label>
            <textarea
              id="summarize-instructions"
              className="w-full min-h-[140px]"
              value={summarizeText}
              onChange={e => setSummarizeText(e.target.value)}
              placeholder="Write the default summarize instructions here..."
            />
            <div className="mt-2 flex items-center gap-2">
              <button onClick={onSaveDirectives} disabled={dirSaving} className="px-3 py-2 border rounded opacity-100 disabled:opacity-50">
                {dirSaving ? 'Saving…' : 'Save'}
              </button>
              {dirLoading && <span className="text-sm text-gray-500">Loading…</span>}
            </div>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded shadow-lg w-full max-w-[520px] p-4">
            <h3 className="mt-0 mb-3">Add LLM configuration</h3>
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
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeModal} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={onSave} disabled={!canSave || saving} className="px-3 py-2 border rounded opacity-100 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsTab
