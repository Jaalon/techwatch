import React, { useEffect, useState } from 'react'
import GroupedByCategoryView from './GroupedByCategoryView'
import { getTechWatchLinks as apiGetTechWatchLinks, removeLinkFromTechWatch as apiRemoveLinkFromTechWatch } from '../../api/techwatch'
import MarkdownExportModal from './MarkdownExportModal.jsx'

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
            <button className="tw-btn" onClick={() => setShowMarkdown(true)}>
              Markdown export
            </button>
            {showMarkdown && (
              <MarkdownExportModal
                isOpen={showMarkdown}
                onRequestClose={() => setShowMarkdown(false)}
                techWatchId={techWatchId}
                date={date}
                links={links}
              />
            )}
          </div>
        </div>
      ) : (
        <div>No articles in this TechWatch.</div>
      )}
    </div>
  )
}
