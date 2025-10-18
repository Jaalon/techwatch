import React, { useState } from 'react'
import MenuComponent from './MenuComponent'
import ContentComponent from './ContentComponent'

function MainPage() {
    const [activeTab, setActiveTab] = useState('links')

    return (
        <div className="page-shell">
            <div className="page-container">
                <header className="app-header">
                    <h1 className="page-title">TechWatch</h1>
                    <MenuComponent activeTab={activeTab} onSelect={setActiveTab} />
                </header>
                <ContentComponent activeTab={activeTab} />
            </div>
        </div>
    )
}

export default MainPage
