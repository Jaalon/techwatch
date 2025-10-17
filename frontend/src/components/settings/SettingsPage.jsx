import React from 'react'
import IAProviderSettingsComponent from './IAProviderSettingsComponent'
import PromptDirectivesComponent from './PromptDirectivesComponent'

export default function SettingsPage() {
  return (
    <div>
      <h2 className="mt-0">Settings</h2>
      <IAProviderSettingsComponent />
      <PromptDirectivesComponent />
    </div>
  )
}
