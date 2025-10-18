import React from 'react'
import TabButton from './TabButton'

export default function MenuComponent({ activeTab, onSelect }) {
  return (
    <div role="tablist" aria-label="TechWatch sections" className="tablist">
      <TabButton id="links" label="Links" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="next" label="Next" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="techwatchs" label="TechWatchs" activeTab={activeTab} onSelect={onSelect} />
      <TabButton id="settings" label="Settings" activeTab={activeTab} onSelect={onSelect} />
    </div>
  )
}
