import React, { useState } from 'react'

function SettingsTab() {
  const [isOpen, setIsOpen] = useState(false)

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
            <p className="mt-0">
              Configurez ici les paramètres liés à l’API d’IA. (Zone de configuration à compléter.)
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default SettingsTab
