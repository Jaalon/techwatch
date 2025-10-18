import React from 'react'

export default function SearchLinkComponent({
  query,
  setQuery,
  status,
  setStatus,
  sort,
  setSort
}) {
  return (
    <section className="mb-3">
      <div className="tw-searchbar p-2 rounded flex flex-wrap gap-2 items-center">
        <input className="tw-input" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        <select className="tw-input" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="TO_PROCESS">To process</option>
          <option value="KEEP">Keep</option>
          <option value="LATER">Later</option>
          <option value="REJECT">Rejected</option>
          <option value="NEXT_TECHWATCH">Next TechWatch</option>
        </select>
        <select className="tw-input" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="date">Date</option>
          <option value="title">Title</option>
        </select>
      </div>
    </section>
  )
}
