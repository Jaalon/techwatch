import React from 'react'
import { exportZip as apiExportZip, analyzeZip as apiAnalyzeZip, executeZip as apiExecuteZip } from '../../api/exchange'
import ConflictResolutionModal from './ConflictResolutionModal.jsx'
import Modal from '../common/Modal.jsx'

export default function ImportExportComponent() {
  const [impOpen, setImpOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [conflicts, setConflicts] = React.useState([])
  const [showModal, setShowModal] = React.useState(false)
  const [info, setInfo] = React.useState(null) // { title, message }
  const fileRef = React.useRef(null)
  const lastZipRef = React.useRef(null)

  const onClickImport = () => fileRef.current?.click()

  // Helpers: stable stringify and deep equality to compare existing vs incoming
  const stableStringify = (value) => {
    const seen = new WeakSet()
    const sorter = (v) => {
      if (v && typeof v === 'object') {
        if (seen.has(v)) return null
        seen.add(v)
        if (Array.isArray(v)) return v.map(sorter)
        const obj = {}
        Object.keys(v).sort().forEach(k => { obj[k] = sorter(v[k]) })
        return obj
      }
      return v
    }
    try {
      return JSON.stringify(sorter(value))
    } catch {
      // Fallback – non-stable stringify
      try { return JSON.stringify(value) } catch { return String(value) }
    }
  }

  const deepEqual = (a, b) => stableStringify(a) === stableStringify(b)

  const onFileChange = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setBusy(true)
      const report = await apiAnalyzeZip(f)
      lastZipRef.current = f
      const list = Array.isArray(report?.conflicts) ? report.conflicts : []
      // Normalize conflicts so that the modal shows the full object (not only the differing field).
      // Also compute diffs based on the merged view (existing + incoming patch) so we only show real differences.
      const normalized = list.map((c) => {
        const existing = (c && typeof c.existing === 'object') ? (c.existing || {}) : (c?.existing ?? {})
        const incoming = (c && typeof c.incoming === 'object') ? (c.incoming || {}) : (c?.incoming ?? {})
        const mergedIncoming = (incoming && typeof incoming === 'object') ? { ...(existing || {}), ...(incoming || {}) } : incoming
        const hasDiff = !deepEqual(existing, mergedIncoming)
        return { ...c, existing, incoming: mergedIncoming, __hasDiff: hasDiff }
      })
      // Show only real differences in the modal; if an entity has no diff, we keep existing silently
      const diffsOnly = normalized.filter(c => c.__hasDiff).map(({ __hasDiff, ...rest }) => rest)
      if (diffsOnly.length === 0) {
        // If backend returned no conflicts, execute import directly using the same ZIP
        try {
          await apiExecuteZip(f)
          setInfo({ title: 'Import', message: 'Import completed successfully.' })
        } catch (e) {
          console.error(e)
          setInfo({ title: 'Import Error', message: `Execute import failed: ${e?.message || 'Unknown error'}` })
        }
      } else {
        setConflicts(diffsOnly)
        setShowModal(true)
      }
    } catch (err) {
      console.error(err)
      setInfo({ title: 'Analyze Error', message: `Import analyze failed: ${err?.message || 'Unknown error'}` })
    } finally {
      setBusy(false)
      try { e.target.value = '' } catch {}
    }
  }

  const download = async (type) => {
    try {
      setBusy(true)
      const blob = await apiExportZip(type)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${type}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setInfo({ title: 'Export Error', message: `Export failed: ${err?.message || 'Unknown error'}` })
    } finally {
      setBusy(false)
    }
  }

  const onCancelModal = () => { setShowModal(false); setConflicts([]) }

  const onResolvedAll = () => {
    setShowModal(false)
    setConflicts([])
    setInfo({ title: 'Import', message: 'All conflicts resolved and imported.' })
  }

  return (
    <section className="border border-gray-300 dark:border-gray-700 rounded mt-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setImpOpen(o => !o)}
        aria-expanded={impOpen}
        aria-controls="import-export-panel"
        className="w-full text-left tw-collapsible-header p-[10px] px-[14px] text-[16px] cursor-pointer flex items-center gap-2"
        style={{ border: 'none' }}
      >
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: impOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>▶</span>
        <strong>Import/Export</strong>
      </button>
      {impOpen && (
        <div
          id="import-export-panel"
          role="region"
          aria-label="Import/Export"
          className="p-[12px] px-[14px] tw-modal-surface"
        >
          <p className="mt-0 text-sm tw-text-muted">Import or export data sets. Import will analyze the ZIP and insert non-conflicting items. If conflicts are detected, you can resolve them one by one.</p>
          <div className="flex gap-2">
            <button className="tw-btn" onClick={onClickImport} disabled={busy}>Import Data</button>
            <button className="tw-btn" onClick={() => download('technical')} disabled={busy}>Export Technical</button>
            <button className="tw-btn" onClick={() => download('functional')} disabled={busy}>Export Functional</button>
          </div>
          <input type="file" accept=".zip" ref={fileRef} onChange={onFileChange} className="hidden" />
        </div>
      )}

      {showModal && (
        <ConflictResolutionModal
          conflicts={conflicts}
          onCancel={onCancelModal}
          onResolvedAll={onResolvedAll}
        />
      )}

      {info && (
        <Modal
          isOpen={true}
          onRequestClose={() => setInfo(null)}
          title={info.title || 'Information'}
          initialSize={{ w: 480, h: 200 }}
          footerContent={(
            <div className="flex justify-end w-full">
              <button className="tw-btn" onClick={() => setInfo(null)}>OK</button>
            </div>
          )}
        >
          <div className="tw-modal-surface p-2 text-sm whitespace-pre-wrap">
            {String(info.message || '')}
          </div>
        </Modal>
      )}
    </section>
  )
}
