import React from 'react'

export default function TabButton({ id, label, activeTab, onSelect }) {
  const isActive = activeTab === id
  return (
    <button
      className={(isActive ? 'tw-tab tw-tab--active' : 'tw-tab')}
      onClick={() => onSelect(id)}
      aria-selected={isActive}
      role="tab"
    >
      {label}
    </button>
  )
}
