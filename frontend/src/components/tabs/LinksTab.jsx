import React from 'react'
import LinkList from '../LinkList'

function LinksTab({
  links,
  error,
  form,
  setForm,
  submit,
  remove,
  updateStatus,
  assignToNext,
  onRemoveTag,
  onAddTag,
  tagInputs,
  setTagInputs,
  tagOptions,
  fetchTagOptions,
  query,
  setQuery,
  status,
  setStatus,
  page,
  setPage,
  size,
  setSize,
  total,
  sort,
  setSort
}) {
  return (
    <div>
      <h2 className="mt-0">Links</h2>
      {error && <div className="error mb-2">{error}</div>}

      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end mb-4">
        <div className="flex flex-col">
          <label>Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="flex flex-col min-w-[280px]">
          <label>URL</label>
          <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        </div>
        <div className="flex flex-col flex-1 min-w-[240px]">
          <label>Description</label>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit">Add</button>
      </form>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="TO_PROCESS">To process</option>
          <option value="KEEP">Keep</option>
          <option value="LATER">Later</option>
          <option value="REJECT">Rejected</option>
          <option value="NEXT_TECHWATCH">Next TechWatch</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="date">Date</option>
          <option value="title">Title</option>
        </select>
      </div>

      <LinkList
        links={links}
        tagInputs={tagInputs}
        setTagInputs={setTagInputs}
        tagOptions={tagOptions}
        fetchTagOptions={fetchTagOptions}
        onRemoveTag={onRemoveTag}
        onAddTag={onAddTag}
        onUpdateStatus={updateStatus}
        onAssignNext={assignToNext}
        onDelete={remove}
      />

      <div className="flex items-center gap-2 mt-3">
        <button disabled={page <= 0} onClick={() => setPage(Math.max(0, page - 1))}>Previous</button>
        <span>Page {page + 1}</span>
        <button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)}>Next</button>
        <select value={size} onChange={e => setSize(parseInt(e.target.value || '10', 10))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span className="text-gray-600">Total: {total}</span>
      </div>
    </div>
  )
}

export default LinksTab
