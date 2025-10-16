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
    <div className="max-w-[900px] mx-auto my-8 px-4 text-left">
      <h1 className="mb-4">TechWatch</h1>
      <div role="tablist" aria-label="TechWatch sections" className="flex gap-4 border-b border-gray-300 mb-4">
        <TabButton id="links" label="Links" activeTab={activeTab} onSelect={setActiveTab} />
        <TabButton id="next" label="Next" activeTab={activeTab} onSelect={setActiveTab} />
        <TabButton id="techwatchs" label="TechWatchs" activeTab={activeTab} onSelect={setActiveTab} />
        <TabButton id="settings" label="Settings" activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'links' && (LinksContent || <div>Links</div>)}
        {activeTab === 'next' && (NextContent || <div>Next</div>)}
        {activeTab === 'techwatchs' && (TechWatchsContent || <div>TechWatchs</div>)}
        {activeTab === 'settings' && (SettingsContent || <div>Settings</div>)}
      </div>
    </div>
  )
}

export default MainPage
