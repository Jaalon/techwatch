import React from 'react'
import IAModelSettingsComponent from './IAModelSettingsComponent.jsx'
import PromptDirectivesComponent from './PromptDirectivesComponent'
import PageHeader from '../general/PageHeader'
import AiApiKeysSection from './AiApiKeysSection.jsx'

export default function SettingsPage() {
  return (
    <div className="tw-panel p-3 -mt-3">
      <PageHeader title="Settings" />
      <AiApiKeysSection />
      <IAModelSettingsComponent />
      <PromptDirectivesComponent />
    </div>
  )
}
