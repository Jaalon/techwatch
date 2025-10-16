import React from 'react'

// Very light wrapper to respect the requirement that each tab content is a component
function TechWatchsTab({ children }) {
  return (
    <div>
      <h2 className="mt-0">TechWatchs</h2>
      {children}
    </div>
  )
}

export default TechWatchsTab
