import { useEffect, useState } from 'react'
import './App.css'
import LinkList from './components/LinkList'
import TechWatchList from './components/TechWatchList'

import { listLinks, createLink as apiCreateLink, deleteLink as apiDeleteLink, updateLinkStatus as apiUpdateLinkStatus, assignToNext as apiAssignToNext, addTag as apiAddTag, removeTag as apiRemoveTag, searchTags as apiSearchTags } from './api/links'
import { getActiveTechWatch as apiGetActiveTechWatch, listTechWatches as apiListTechWatches, createTechWatch as apiCreateTechWatch, activateTechWatch as apiActivateTechWatch, completeTechWatch as apiCompleteTechWatch, collectNextLinks as apiCollectNextLinks, getTechWatchLinks as apiGetTechWatchLinks, removeLinkFromTechWatch as apiRemoveLinkFromTechWatch } from './api/techwatch'

import MainPage from './components/MainPage'
import LinksTab from './components/tabs/LinksTab'
import NextTab from './components/tabs/NextTab'
import TechWatchsTab from './components/tabs/TechWatchsTab'
import SettingsTab from './components/tabs/SettingsTab'

function App() {
  const [links, setLinks] = useState([])
  const [form, setForm] = useState({ title: '', url: '', description: '' })
  const [error, setError] = useState('')
  const [tagInputs, setTagInputs] = useState({}) // { [linkId]: text }
  const [tagOptions, setTagOptions] = useState({}) // { [linkId]: [{id,name}] }

  // TechWatch state
  const [activeTechWatch, setActiveTechWatch] = useState(null)
  const [techWatchForm, setTechWatchForm] = useState({ date: '', maxArticles: 10 })
  const [techWatches, setTechWatches] = useState([])
  const [activeLinks, setActiveLinks] = useState([])
  const [openedTechWatch, setOpenedTechWatch] = useState(null)
  const [openedLinks, setOpenedLinks] = useState([])
  const [showMarkdown, setShowMarkdown] = useState(false)

  // ToConsider view state
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('date')

  const load = async () => {
    setError('')
    try {
      const { items, total: totalFromHeader } = await listLinks({ status, q: query, page, size, sort })
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
    loadActiveTechWatch()
    loadTechWatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, page, size, sort])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.url) {
      setError('Title and URL are required')
      return
    }
    try {
      await apiCreateLink(form)
      setForm({ title: '', url: '', description: '' })
      // After adding, reload first page to see newest first
      setPage(0)
      await load()
    } catch (e) {
      setError('Error while creating: ' + e.message)
    }
  }

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

  // TechWatch functions
  const loadActiveLinks = async (twId) => {
    if (!twId) { setActiveLinks([]); return }
    try {
      const data = await apiGetTechWatchLinks(twId)
      setActiveLinks(data)
    } catch (e) {
      console.error(e)
      setActiveLinks([])
    }
  }

  const loadOpenedLinks = async (twId) => {
    if (!twId) { setOpenedLinks([]); return }
    try {
      const data = await apiGetTechWatchLinks(twId)
      setOpenedLinks(data)
    } catch (e) {
      console.error(e)
      setOpenedLinks([])
    }
  }

  const openTechWatchDetails = async (tw) => {
    setOpenedTechWatch(tw)
    setShowMarkdown(false)
    await loadOpenedLinks(tw?.id)
  }

  const removeFromTechWatch = async (twId, linkId) => {
    try {
      await apiRemoveLinkFromTechWatch(twId, linkId)
      if (activeTechWatch && activeTechWatch.id === twId) {
        await loadActiveLinks(twId)
      }
      if (openedTechWatch && openedTechWatch.id === twId) {
        await loadOpenedLinks(twId)
      }
    } catch (e) {
      console.error(e)
      setError(`Failed to remove from TechWatch: ${e.message}`)
    }
  }

  const loadActiveTechWatch = async () => {
    try {
      const data = await apiGetActiveTechWatch()
      if (!data) {
        setActiveTechWatch(null)
        setActiveLinks([])
        return
      }
      setActiveTechWatch(data)
      await loadActiveLinks(data.id)
    } catch (e) {
      console.error(e)
      setActiveTechWatch(null)
      setActiveLinks([])
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
    }
  }

  const loadTechWatches = async () => {
    try {
      const data = await apiListTechWatches()
      setTechWatches(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setTechWatches([])
      setError(e?.message?.includes('Failed to fetch') ? 'Server unreachable' : `Server error (TechWatch): ${e.message}`)
    }
  }

  const createTechWatch = async (e) => {
    e.preventDefault()
    if (!techWatchForm.date) {
      setError('TechWatch date is required')
      return
    }
    try {
      await apiCreateTechWatch({ date: techWatchForm.date, maxArticles: techWatchForm.maxArticles })
      setTechWatchForm({ date: '' })
      await loadTechWatches()
    } catch (e) {
      setError('Failed to create TechWatch: ' + e.message)
    }
  }

  const activateTechWatch = async (id) => {
    await apiActivateTechWatch(id)
    await loadActiveTechWatch()
    await loadTechWatches()
  }

  const completeTechWatch = async (id) => {
    await apiCompleteTechWatch(id)
    await loadActiveTechWatch()
    await loadTechWatches()
  }

  const collectNextLinks = async (id) => {
    await apiCollectNextLinks(id)
    await load()
    await loadActiveLinks(id)
  }

  const assignToNext = async (id) => {
    await apiAssignToNext(id)
    await load()
    if (activeTechWatch) await loadActiveLinks(activeTechWatch.id)
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
      if (activeTechWatch) await loadActiveLinks(activeTechWatch.id)
      if (openedTechWatch) await loadOpenedLinks(openedTechWatch.id)
    } catch (e) {
      console.error(e)
      setError(`Failed to add tag: ${e.message}`)
    }
  }

  const removeTagFromLink = async (id, name) => {
    try {
      await apiRemoveTag(id, name)
      await load()
      if (activeTechWatch) await loadActiveLinks(activeTechWatch.id)
      if (openedTechWatch) await loadOpenedLinks(openedTechWatch.id)
    } catch (e) {
      console.error(e)
      setError(`Failed to remove tag: ${e.message}`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / size))

  const buildMarkdown = (date, list, chosenMap) => {
    const lines = []
    const d = date || ''
    if (d) lines.push(String(d))
    // Group by category using chosenMap override if valid; otherwise first tag (alphabetical). If none, use 'AUTRES'.
    const groups = {}
    for (const l of Array.isArray(list) ? list : []) {
      const tagNames = (l.tags || []).map(t => t.name).sort((a,b)=>a.localeCompare(b))
      const override = chosenMap && chosenMap[l.id]
      const cat = (override && tagNames.includes(override)) ? override : (tagNames[0] || 'AUTRES')
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(l)
    }
    // Order categories alphabetically, but keep 'AUTRES' at the end
    const cats = Object.keys(groups).sort((a,b) => {
      if (a === 'AUTRES') return 1
      if (b === 'AUTRES') return -1
      return a.localeCompare(b)
    })
    for (const cat of cats) {
      lines.push(``)
      lines.push(`${cat}`)
      for (const l of groups[cat]) {
        const title = l.title || ''
        const url = l.url || ''
        const desc = (l.description || '').trim()
        lines.push(desc ? `* [${title}](${url}): ${desc}` : `* [${title}](${url})`)
      }
    }
    return lines.join('\n')
  }

  const linksContent = (
    <LinksTab
      links={links}
      error={error}
      form={form}
      setForm={setForm}
      submit={submit}
      remove={remove}
      updateStatus={updateStatus}
      assignToNext={assignToNext}
      onRemoveTag={removeTagFromLink}
      onAddTag={addTagToLink}
      tagInputs={tagInputs}
      setTagInputs={setTagInputs}
      tagOptions={tagOptions}
      fetchTagOptions={fetchTagOptions}
      query={query}
      setQuery={setQuery}
      status={status}
      setStatus={setStatus}
      page={page}
      setPage={setPage}
      size={size}
      setSize={setSize}
      total={total}
      sort={sort}
      setSort={setSort}
    />
  )

  const techWatchsContent = (
    <TechWatchsTab>
      <section className="border border-gray-300 p-4 mb-4 rounded">
        <form onSubmit={createTechWatch} className="flex gap-2 flex-wrap items-center mb-3">
          <input type="date" value={techWatchForm.date} onChange={e => setTechWatchForm({ ...techWatchForm, date: e.target.value })} />
          <input type="number" min={1} max={100} value={techWatchForm.maxArticles}
                 onChange={e => setTechWatchForm({ ...techWatchForm, maxArticles: parseInt(e.target.value || '10', 10) })}
                 title="Max articles" className="w-32" />
          <button type="submit">Create planned TechWatch</button>
        </form>

        <TechWatchList items={techWatches} onOpen={openTechWatchDetails} onActivate={activateTechWatch} onComplete={completeTechWatch} />
      </section>

      {openedTechWatch && (
        <section className="border border-gray-300 p-4 mb-4 rounded">
          <div className="flex items-center gap-2">
            <h3 className="m-0">Opened TechWatch: #{openedTechWatch.id} — {openedTechWatch.date} — {openedTechWatch.status}</h3>
            <button onClick={() => { setOpenedTechWatch(null); setOpenedLinks([]); setShowMarkdown(false) }} className="ml-auto">Close</button>
          </div>
          {openedLinks.length > 0 ? (
            <div>
              <GroupedByCategoryView
                links={openedLinks}
                onAddTag={addTagToLink}
                onRemoveTag={removeTagFromLink}
                onUpdateStatus={updateStatus}
                onAssignNext={assignToNext}
                onDelete={remove}
                tagInputs={tagInputs}
                setTagInputs={setTagInputs}
                tagOptions={tagOptions}
                fetchTagOptions={fetchTagOptions}
                mode="mvt"
                techWatchId={openedTechWatch.id}
                onRemoveFromTechWatch={removeFromTechWatch}
              />

              <div className="mt-4">
                <button onClick={() => setShowMarkdown(v => !v)}>
                  {showMarkdown ? 'Hide Markdown export' : 'Show Markdown export'}
                </button>
                {showMarkdown && (() => {
                  let chosen = {}
                  try { chosen = JSON.parse(localStorage.getItem(`mvtCategory:${openedTechWatch.id}`) || '{}') } catch {}
                  const md = buildMarkdown(openedTechWatch.date, openedLinks, chosen)
                  const copyText = async () => {
                    try { await navigator.clipboard.writeText(md) } catch (e) { console.error(e) }
                  }
                  const download = () => {
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `${openedTechWatch.date}-mvt.md`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                  }
                  return (
                    <div className="mt-2">
                      <h4 className="my-2">Export Markdown</h4>
                      <textarea readOnly value={md} rows={10} className="w-full font-mono text-sm"></textarea>
                      <div className="mt-2 flex gap-2">
                        <button onClick={copyText}>Copy text</button>
                        <button onClick={download}>Download .md</button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div>No articles in this TechWatch.</div>
          )}
        </section>
      )}
    </TechWatchsTab>
  )

  const nextContent = (
    <section className="border border-gray-300 p-4 mb-4 rounded">
      <h3 className="mt-0">Active TechWatch and management</h3>
      {activeTechWatch ? (
        <div className="mb-3">
          <strong>Active TechWatch:</strong> {activeTechWatch.date} — max {activeTechWatch.maxArticles} articles — currently {activeLinks.length}
          <div className="mt-2 flex gap-2">
            <button onClick={() => collectNextLinks(activeTechWatch.id)}>Collect Next TechWatch links</button>
            <button onClick={() => completeTechWatch(activeTechWatch.id)}>Complete</button>
          </div>
          {activeLinks.length > 0 && (
            <div className="mt-2">
              <details>
                <summary>Show articles ({activeLinks.length})</summary>
                <ul>
                  {activeLinks.map(al => (
                    <li key={al.id} className="flex items-center gap-2">
                      <span>#{al.id} {al.title}</span>
                      <button onClick={() => removeFromTechWatch(activeTechWatch.id, al.id)} className="ml-auto">Remove from this TechWatch</button>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          {activeLinks.length > 0 && (
            <div className="mt-2">
              <h4 className="my-2">Articles grouped by category</h4>
              <GroupedByCategoryView
                links={activeLinks}
                onAddTag={addTagToLink}
                onRemoveTag={removeTagFromLink}
                onUpdateStatus={updateStatus}
                onAssignNext={assignToNext}
                onDelete={remove}
                tagInputs={tagInputs}
                setTagInputs={setTagInputs}
                tagOptions={tagOptions}
                fetchTagOptions={fetchTagOptions}
                mode="mvt"
                techWatchId={activeTechWatch.id}
                onRemoveFromTechWatch={removeFromTechWatch}
              />

              {/* Markdown export for active TechWatch, same as opened mvt in Techwatch tab */}
              <div className="mt-4">
                <button onClick={() => setShowMarkdown(v => !v)}>
                  {showMarkdown ? 'Hide Markdown export' : 'Show Markdown export'}
                </button>
                {showMarkdown && (() => {
                  let chosen = {}
                  try { chosen = JSON.parse(localStorage.getItem(`mvtCategory:${activeTechWatch.id}`) || '{}') } catch {}
                  const md = buildMarkdown(activeTechWatch.date, activeLinks, chosen)
                  const copyText = async () => {
                    try { await navigator.clipboard.writeText(md) } catch (e) { console.error(e) }
                  }
                  const download = () => {
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `${activeTechWatch.date}-mvt.md`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                  }
                  return (
                    <div className="mt-2">
                      <h4 className="my-2">Export Markdown</h4>
                      <textarea readOnly value={md} rows={10} className="w-full font-mono text-sm"></textarea>
                      <div className="mt-2 flex gap-2">
                        <button onClick={copyText}>Copy text</button>
                        <button onClick={download}>Download .md</button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3">No active TechWatch</div>
      )}
    </section>
  )

  const settingsContent = (
    <SettingsTab />
  )

  return (
    <MainPage
      LinksContent={linksContent}
      NextContent={nextContent}
      TechWatchsContent={techWatchsContent}
      SettingsContent={settingsContent}
    />
  )
}

// ---- GroupedByCategoryView component ----
function GroupedByCategoryView({
  links,
  onAddTag,
  onRemoveTag,
  onUpdateStatus,
  onAssignNext,
  onDelete,
  tagInputs,
  setTagInputs,
  tagOptions,
  fetchTagOptions,
  mode,
  techWatchId,
  onRemoveFromTechWatch
}) {
  const [chosenCategory, setChosenCategory] = useState({}) // { [linkId]: tagName | 'Uncategorized' }
  const [draggingLinkId, setDraggingLinkId] = useState(null)
  const [showBottomChooserFor, setShowBottomChooserFor] = useState(null)

  const storageKey = techWatchId ? `mvtCategory:${techWatchId}` : null
  // Load saved categories for this TechWatch
  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setChosenCategory(parsed)
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey])
  // Helper to update and persist
  const updateChosenCategory = (updater) => {
    setChosenCategory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (e) { /* ignore */ }
      }
      return next
    })
  }

  const allTagNames = Array.from(new Set((links || []).flatMap(l => (l.tags || []).map(t => t.name)))).sort((a, b) => a.localeCompare(b))
  const UNCATEGORIZED = 'Uncategorized'

  const getChosenCatFor = (l) => {
    const desired = chosenCategory[l.id]
    const tagNames = (l.tags || []).map(t => t.name)
    if (desired && (desired === UNCATEGORIZED || tagNames.includes(desired))) return desired
    if (tagNames.length > 0) return tagNames[0]
    return UNCATEGORIZED
  }

  // Build groups
  const groups = {}
  allTagNames.forEach(t => { groups[t] = [] })
  groups[UNCATEGORIZED] = []
  for (const l of links || []) {
    const cat = getChosenCatFor(l)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(l)
  }

  const onDragStart = (e, l) => {
    setDraggingLinkId(l.id)
    setShowBottomChooserFor(null)
    const payload = { id: l.id, tags: (l.tags || []).map(t => t.name) }
    e.dataTransfer.setData('application/json', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragEnd = () => {
    setDraggingLinkId(null)
    setShowBottomChooserFor(null)
  }

  const makeCategoryDroppableProps = (categoryName) => ({
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' },
    onDrop: (e) => {
      try {
        const txt = e.dataTransfer.getData('application/json') || '{}'
        const data = JSON.parse(txt)
        const allowed = Array.isArray(data.tags) && data.tags.includes(categoryName)
        if (allowed) {
          updateChosenCategory(prev => ({ ...prev, [data.id]: categoryName }))
        }
      } catch (err) { /* ignore */ }
      setShowBottomChooserFor(null)
    },
    onDragEnter: () => setShowBottomChooserFor(null)
  })

  const bottomZoneProps = {
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' },
    onDragEnter: () => setShowBottomChooserFor(draggingLinkId),
    onDrop: () => setShowBottomChooserFor(null)
  }

  const isMvt = mode === 'mvt'

  const renderBullet = (l) => (
    <li key={l.id}
        draggable
        onDragStart={(e) => onDragStart(e, l)}
        onDragEnd={onDragEnd}
        className="py-1 rounded cursor-grab flex items-center">
      {isMvt ? null : <span>- </span>}
      <a href={l.url} target="_blank" rel="noreferrer">{l.title}</a>
      {isMvt ? (
        <>
          {l.description ? <span className="ml-1">: {l.description}</span> : null}
          <button
            title="Remove from this TechWatch"
            onClick={() => onRemoveFromTechWatch && techWatchId && onRemoveFromTechWatch(techWatchId, l.id)}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >&times;</button>
        </>
      ) : (
        <>
          <span>[{l.url}]</span>
          {l.description ? <span>: {l.description}</span> : null}
          <span className="ml-auto inline-flex gap-1">
            <button onClick={() => onUpdateStatus(l.id, 'KEEP')}>Keep</button>
            <button onClick={() => onUpdateStatus(l.id, 'LATER')}>Later</button>
            <button onClick={() => onUpdateStatus(l.id, 'REJECT')}>Reject</button>
            <button onClick={() => onAssignNext(l.id)}>Next TW</button>
            <button onClick={() => onDelete(l.id)}>Del</button>
          </span>
        </>
      )}
    </li>
  )

  return (
    <div>
      {Object.keys(groups).filter(k => groups[k].length > 0 || k === UNCATEGORIZED).map((cat) => (
        <section key={cat} className="border border-gray-300 px-3 py-2 mb-3 rounded" {...(cat !== UNCATEGORIZED ? makeCategoryDroppableProps(cat) : {})}>
          <div className="font-bold mb-1">{cat}</div>
          <ul className="m-0 pl-4">
            {groups[cat].map(renderBullet)}
          </ul>
        </section>
      ))}

      {/* Bottom chooser area: appears when dragging and under the last category */}
      <div className="border-2 border-dashed border-gray-400 p-3 text-center text-gray-600" {...bottomZoneProps}>
        {showBottomChooserFor ? (
          (() => {
            const l = (links || []).find(x => x.id === showBottomChooserFor)
            const tagNames = (l?.tags || []).map(t => t.name)
            if (!l || tagNames.length === 0) return <span>Drop here to cancel</span>
            return (
              <div className="inline-flex gap-2 flex-wrap items-center">
                <span>Choose category:</span>
                {tagNames.map(name => (
                  <div key={name}
                       onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                       onDrop={() => { updateChosenCategory(prev => ({ ...prev, [l.id]: name })); setShowBottomChooserFor(null) }}
                       onClick={() => { updateChosenCategory(prev => ({ ...prev, [l.id]: name })); setShowBottomChooserFor(null) }}
                       className="px-2 py-1 border border-indigo-300 bg-indigo-50 rounded-full cursor-pointer">
                    {name}
                  </div>
                ))}
              </div>
            )
          })()
        ) : (
          <span>Drag a link here to choose its category from its tags</span>
        )}
      </div>
    </div>
  )
}

export default App
