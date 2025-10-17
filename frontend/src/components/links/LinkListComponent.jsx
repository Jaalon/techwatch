import React from 'react'
import LinkList from './LinkList'

// Thin wrapper to align with requested naming while reusing existing LinkList component
export default function LinkListComponent(props) {
  return <LinkList {...props} />
}
