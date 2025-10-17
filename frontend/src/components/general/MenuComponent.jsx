import React from 'react'
import TabButton from './TabButton'

export default function MenuComponent({ activeTab, onSelect }) {
  return (
    <div role="tablist" aria-label="TechWatch sections" style={{ display: 'flex', gap: 16, borderBottom: '1px solid #d1d5db', marginBottom: 16 }}>
      <TabButton id="links" label="Links" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="next" label="Next" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="techwatchs" label="TechWatchs" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="settings" label="Settings" activeTab={activeTab} onSelect={onSelect} />
    </div>
  )
}
