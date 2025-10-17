import React, { useState } from 'react'
import MenuComponent from './MenuComponent'
import ContentComponent from './ContentComponent'

function MainPage() {
  const [activeTab, setActiveTab] = useState('links')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, padding: '32px 16px', textAlign: 'left' }}>
        <h1 style={{ marginBottom: 16 }}>TechWatch</h1>
        <MenuComponent activeTab={activeTab} onSelect={setActiveTab} />
        <ContentComponent activeTab={activeTab} />
      </div>
    </div>
  )
}

export default MainPage
