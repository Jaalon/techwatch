import React, { useEffect, useState } from 'react'
import { listLinks, deleteLink as apiDeleteLink, updateLinkStatus as apiUpdateLinkStatus, assignToNext as apiAssignToNext, addTag as apiAddTag, removeTag as apiRemoveTag, searchTags as apiSearchTags } from '../../api/links'
import AddLinkModal from './AddLinkModal.jsx'
import SearchLinkComponent from './SearchLinkComponent'
import LinkListComponent from './LinkListComponent'
import PageHeader from '../general/PageHeader.jsx'

export default function LinksPage() {
  const [links, setLinks] = useState([])
  const [error, setError] = useState('')
  const [tagInputs, setTagInputs] = useState({}) // { [linkId]: text }
  const [tagOptions, setTagOptions] = useState({}) // { [linkId]: [{id,name}] }

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('date')
  const [showAll, setShowAll] = useState(true)

  const load = async () => {
    setError('')
    try {
      const { items, total: totalFromHeader } = await listLinks({ status, q: query, page, size, sort, withoutTw: !showAll })
      setLinks(items)
      setTotal(typeof totalFromHeader === 'number' ? totalFromHeader : items.length)
    } catch (e) {
      console.error(e)
      setLinks([])
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error: ${e.message}`)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, page, size, sort, showAll])

  const remove = async (id) => {
    await apiDeleteLink(id)
    await load()
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await apiUpdateLinkStatus(id, newStatus)
      await load()
    } catch (e) {
      console.error(e)
    }
  }

  const assignToNext = async (id) => {
    await apiAssignToNext(id)
    await load()
  }

  // Tagging helpers
  const fetchTagOptions = async (id, text) => {
    try {
      if (!text) { setTagOptions(prev => ({ ...prev, [id]: [] })); return }
      const data = await apiSearchTags(text, 10)
      setTagOptions(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }))
    } catch (e) {
      console.error(e)
    }
  }

  const addTagToLink = async (id, name) => {
    if (!name) return
    try {
      await apiAddTag(id, name)
      setTagInputs(prev => ({ ...prev, [id]: '' }))
      setTagOptions(prev => ({ ...prev, [id]: [] }))
      await load()
    } catch (e) {
      console.error(e)
      setError(`Failed to add tag: ${e.message}`)
    }
  }

  const removeTagFromLink = async (id, name) => {
    try {
      await apiRemoveTag(id, name)
      await load()
    } catch (e) {
      console.error(e)
      setError(`Failed to remove tag: ${e.message}`)
    }
  }


  return (
    <div className="tw-panel p-3 -mt-3">
    <PageHeader title="Links Database" error={error} />
    <div >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <SearchLinkComponent
              query={query}
              setQuery={setQuery}
              status={status}
              setStatus={setStatus}
              sort={sort}
              setSort={setSort}
              showAll={showAll}
              setShowAll={setShowAll}
          />
        </div>
        <div className="ml-auto">
          <AddLinkModal onAdded={() => { setPage(0); load() }} />
        </div>
      </div>


      <LinkListComponent
        links={links}
        tagInputs={tagInputs}
        setTagInputs={setTagInputs}
        tagOptions={tagOptions}
        fetchTagOptions={fetchTagOptions}
        onRemoveTag={removeTagFromLink}
        onAddTag={addTagToLink}
        onUpdateStatus={updateStatus}
        onAssignNext={assignToNext}
        onDelete={remove}
        onEdited={load}
      />
    </div>
  </div>
)
}
