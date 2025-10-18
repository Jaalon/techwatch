import React, { useEffect, useState } from 'react'
import { listConfigs as apiListConfigs, setDefaultConfig as apiSetDefaultConfig } from '../../api/llm'
import AddLlmProviderModal from './AddLlmProviderModal.jsx'

export default function IAProviderSettingsComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [configs, setConfigs] = useState([])

  const resetForm = () => {}

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
  const closeModal = () => { setShowModal(false) }

  const setDefault = async (id) => {
    try {
      await apiSetDefaultConfig(id)
      await loadConfigs()
    } catch (e) {
      console.error(e)
    }
  }

  return (
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
          <p className="mt-0">Gérez les configurations LLM.</p>

          <div className="flex justify-between items-center mb-2">
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

      {showModal && (
        <AddLlmProviderModal
          isOpen={showModal}
          onRequestClose={closeModal}
          onSaved={loadConfigs}
        />
      )}
    </section>
  )
}
