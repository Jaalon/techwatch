import React from 'react'
import Modal from '../common/Modal.jsx'

/**
 * Modal to export TechWatch content to Markdown.
 * Extends the shared Modal component.
 */
export default function MarkdownExportModal({
                                                isOpen,
                                                onRequestClose,
                                                techWatchId,
                                                date,
                                                links = [],
                                            }) {
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

    const footer = (
        <div className="flex items-center justify-end gap-2">
            <button className="tw-btn tw-btn--sm" type="button" onClick={copyText}>Copy text</button>
            <button className="tw-btn tw-btn--sm" type="button" onClick={download}>Download .md</button>
            <button className="tw-btn tw-btn--sm" type="button" onClick={onRequestClose}>Close</button>
        </div>
    )

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={"Markdown export"}
            initialSize={{ w: 720, h: 420 }}
            footerContent={footer}
        >
            <div className="mt-2">
                <textarea readOnly value={md} rows={12} className="w-full font-mono text-sm"></textarea>
            </div>
        </Modal>
    )
}
