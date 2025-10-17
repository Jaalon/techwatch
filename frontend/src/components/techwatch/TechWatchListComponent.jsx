import React from 'react'
import TechWatchList from './TechWatchList'

// Thin wrapper to align with requested naming while reusing existing TechWatchList component
export default function TechWatchListComponent(props) {
  return <TechWatchList {...props} />
}
