import React, { useEffect, useState } from 'react'
import { getSummarizeInstruction, saveSummarizeInstruction } from '../../api/instructions'

export default function PromptDirectivesComponent() {
  const [dirOpen, setDirOpen] = useState(false)
  const [summarizeText, setSummarizeText] = useState('')
  const [dirLoading, setDirLoading] = useState(false)
  const [dirSaving, setDirSaving] = useState(false)
  const [dirError, setDirError] = useState('')

  // Load summarize text when opening the section the first time
  useEffect(() => {
    const load = async () => {
      setDirLoading(true)
      setDirError('')
      try {
        const txt = await getSummarizeInstruction()
        setSummarizeText(txt || '')
      } catch (e) {
        setDirError(e?.message || 'Failed to load')
      } finally {
        setDirLoading(false)
      }
    }
    if (dirOpen && !summarizeText) {
      load()
    }
  }, [dirOpen])

  const onSaveDirectives = async () => {
    setDirSaving(true)
    setDirError('')
    try {
      const saved = await saveSummarizeInstruction(summarizeText)
      setSummarizeText(saved)
    } catch (e) {
      setDirError(e?.message || 'Save failed')
    } finally {
      setDirSaving(false)
    }
  }

  return (
    <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setDirOpen(o => !o)}
        aria-expanded={dirOpen}
        aria-controls="prompt-directives-panel"
        className="w-full text-left bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
        style={{ border: 'none' }}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: dirOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>▶</span>
        <strong>Prompt directives</strong>
      </button>
      {dirOpen && (
        <div
          id="prompt-directives-panel"
          role="region"
          aria-label="Prompt directives"
          className="p-[12px] px-[14px] bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
        >
          {/* Requested change: remove the descriptive sentence */}
          {dirError && <div className="mb-2 text-red-600 text-sm">{dirError}</div>}
          <label className="block text-sm mb-1" htmlFor="summarize-instructions">Summarize instructions</label>
          <textarea
            id="summarize-instructions"
            className="w-full min-h[140px]"
            value={summarizeText}
            onChange={e => setSummarizeText(e.target.value)}
            placeholder="Write the default summarize instructions here..."
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={onSaveDirectives} disabled={dirSaving} className="px-3 py-2 border rounded opacity-100 disabled:opacity-50">
              {dirSaving ? 'Saving…' : 'Save'}
            </button>
            {dirLoading && <span className="text-sm text-gray-500">Loading…</span>}
          </div>
        </div>
      )}
    </section>
  )
}
