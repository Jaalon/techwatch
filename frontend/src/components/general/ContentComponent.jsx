import React from 'react'
import LinksPage from '../links/LinksPage'
import NextTechWatchPage from '../techwatch/NextTechWatchPage'
import TechWatchListPage from '../techwatch/TechWatchListPage'
import SettingsPage from '../settings/SettingsPage'

export default function ContentComponent({ activeTab }) {
  return (
    <div className="content-area">
      {activeTab === 'links' && <LinksPage />}
      {activeTab === 'next' && <NextTechWatchPage />}
      {activeTab === 'techwatchs' && <TechWatchListPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </div>
  )
}
