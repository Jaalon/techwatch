import React, { useState } from 'react'

function TabButton({ id, label, activeTab, onSelect }) {
  const isActive = activeTab === id
  return (
    <button
      className={"px-3 py-2 border-b-2 " + (isActive ? "border-blue-600 font-semibold" : "border-transparent text-gray-600")}
      onClick={() => onSelect(id)}
      aria-selected={isActive}
      role="tab"
    >
      {label}
    </button>
  )
}

function MainPage({
  LinksContent,
  NextContent,
  TechWatchsContent,
  SettingsContent
}) {
  const [activeTab, setActiveTab] = useState('links')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, padding: '32px 16px', textAlign: 'left' }}>
        <h1 style={{ marginBottom: 16 }}>TechWatch</h1>
        <div role="tablist" aria-label="TechWatch sections" style={{ display: 'flex', gap: 16, borderBottom: '1px solid #d1d5db', marginBottom: 16 }}>
          <TabButton id="links" label="Links" activeTab={activeTab} onSelect={setActiveTab} />
          <TabButton id="next" label="Next" activeTab={activeTab} onSelect={setActiveTab} />
          <TabButton id="techwatchs" label="TechWatchs" activeTab={activeTab} onSelect={setActiveTab} />
          <TabButton id="settings" label="Settings" activeTab={activeTab} onSelect={setActiveTab} />
        </div>

        <div style={{ minHeight: 200 }}>
          {activeTab === 'links' && (LinksContent || <div>Links</div>)}
          {activeTab === 'next' && (NextContent || <div>Next</div>)}
          {activeTab === 'techwatchs' && (TechWatchsContent || <div>TechWatchs</div>)}
          {activeTab === 'settings' && (SettingsContent || <div>Settings</div>)}
        </div>
      </div>
    </div>
  )
}

export default MainPage
