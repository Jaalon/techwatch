import React from 'react'

export default function TabButton({ id, label, activeTab, onSelect }) {
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
