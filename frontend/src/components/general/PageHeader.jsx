import React from 'react'

export default function PageHeader({ title, error}) {
  return (
    <header>
      <div>
        <h2 className="page-subtitle">{title}</h2>
      </div>
      {error ? (
        <div className="tw-error mt-2">{error}</div>
      ) : null}
    </header>
  )
}
