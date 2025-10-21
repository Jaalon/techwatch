import React, { useEffect, useState } from 'react'
import GroupedByCategoryView from './GroupedByCategoryView'
import { getTechWatchLinks as apiGetTechWatchLinks, removeLinkFromTechWatch as apiRemoveLinkFromTechWatch } from '../../api/techwatch'

export default function TechWatchComponent({ techWatchId, date }) {
  const [links, setLinks] = useState([])
  const [showMarkdown, setShowMarkdown] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!techWatchId) { setLinks([]); return }
      try {
        const data = await apiGetTechWatchLinks(techWatchId)
        setLinks(data)
      } catch (e) {
        console.error(e)
        setLinks([])
      }
    }
    load()
  }, [techWatchId])

  const reloadLinks = async () => {
    if (!techWatchId) { setLinks([]); return }
    try {
      const data = await apiGetTechWatchLinks(techWatchId)
      setLinks(data)
    } catch (e) {
      console.error(e)
      setLinks([])
    }
  }

  const removeFromTechWatch = async (linkId) => {
    if (!techWatchId) return
    try {
      await apiRemoveLinkFromTechWatch(techWatchId, linkId)
      await reloadLinks()
    } catch (e) {
      console.error(e)
    }
  }

  const buildMarkdown = (twDate, list, chosenMap) => {
    const lines = []
    const d = twDate || ''
    if (d) lines.push(String(d))
    const groups = {}
    for (const l of Array.isArray(list) ? list : []) {
      const tagNames = (l.tags || []).map(t => t.name).sort((a,b)=>a.localeCompare(b))
      const override = chosenMap && chosenMap[l.id]
      const cat = (override && tagNames.includes(override)) ? override : (tagNames[0] || 'AUTRES')
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(l)
    }
    const cats = Object.keys(groups).sort((a,b) => {
      if (a === 'AUTRES') return 1
      if (b === 'AUTRES') return -1
      return a.localeCompare(b)
    })
    for (const cat of cats) {
      lines.push('')
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

  if (!techWatchId) {
    return <div>No TechWatch selected</div>
  }

  return (
    <div>
      {links.length > 0 ? (
        <div>
          <GroupedByCategoryView
            links={links}
            mode="mvt"
            techWatchId={techWatchId}
            onRemoveFromTechWatch={(_, linkId) => removeFromTechWatch(linkId)}
            onEdited={reloadLinks}
          />

          <div className="mt-4">
            <button className="tw-btn" onClick={() => setShowMarkdown(v => !v)}>
              {showMarkdown ? 'Hide Markdown export' : 'Markdown export'}
            </button>
            {showMarkdown && (() => {
              let chosen = {}
              try { chosen = JSON.parse(localStorage.getItem(`mvtCategory:${techWatchId}`) || '{}') } catch {}
              const md = buildMarkdown(date, links, chosen)
              const copyText = async () => {
                try { await navigator.clipboard.writeText(md) } catch (e) { console.error(e) }
              }
              const download = () => {
                const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `${(date || `tw-${techWatchId}`)}-mvt.md`
                document.body.appendChild(a)
                a.click()
                a.remove()
              }
              return (
                <div className="mt-2">
                  <textarea readOnly value={md} rows={10} className="w-full font-mono text-sm"></textarea>
                  <div className="mt-2 flex gap-2">
                    <button className="tw-btn tw-btn--sm" onClick={copyText}>Copy text</button>
                    <button className="tw-btn tw-btn--sm" onClick={download}>Download .md</button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      ) : (
        <div>No articles in this TechWatch.</div>
      )}
    </div>
  )
}
