import React from 'react'
import IAProviderSettingsComponent from './IAProviderSettingsComponent'
import PromptDirectivesComponent from './PromptDirectivesComponent'
import PageHeader from '../general/PageHeader'

export default function SettingsPage() {
  return (
    <div className="tw-panel p-3 -mt-3">
      <PageHeader title="Settings" />
      <IAProviderSettingsComponent />
      <PromptDirectivesComponent />
    </div>
  )
}
