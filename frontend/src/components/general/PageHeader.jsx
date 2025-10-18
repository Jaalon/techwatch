import React from 'react'

export default function PageHeader({ title, error, actions, className = '' }) {
  return (
    <header className={`mb-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="page-subtitle">{title}</h2>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
      {error ? (
        <div className="tw-error mb-2">{error}</div>
      ) : null}
    </header>
  )
}
