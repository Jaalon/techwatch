import React from 'react'
import Modal from '../common/Modal.jsx'
import MergeEditor from './MergeEditor.jsx'
import { resolveOne as apiResolveOne, exportConflicts as apiExportConflicts } from '../../api/exchange'

const PAGE_SIZE = 15

export default function ConflictResolutionModal({ conflicts = [], onCancel, onResolvedAll }) {
  const [items, setItems] = React.useState(Array.isArray(conflicts) ? conflicts : [])
  const [page, setPage] = React.useState(1)
  const [busy, setBusy] = React.useState(false)
  const [mergeFor, setMergeFor] = React.useState(null) // { entity, key, existing, incoming, result }
  const [info, setInfo] = React.useState(null) // { title, message }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  React.useEffect(() => {
    setItems(Array.isArray(conflicts) ? conflicts : [])
    setPage(1)
  }, [conflicts])

  const removeAtIndex = (globalIdx) => {
    setItems(prev => {
      const next = prev.slice()
      next.splice(globalIdx, 1)
      return next
    })
  }

  React.useEffect(() => {
    if (items.length === 0) onResolvedAll?.()
    else if (page > totalPages) setPage(totalPages)
  }, [items.length, totalPages])

  const onKeepExisting = (globalIdx) => {
    // No server change, just dismiss this item
    removeAtIndex(globalIdx)
  }

  const onOverwrite = async (globalIdx, c) => {
    try {
      setBusy(true)
      await apiResolveOne(c.entity, c.key, c.incoming)
      removeAtIndex(globalIdx)
    } catch (e) {
      console.error(e)
      setInfo({ title: 'Error', message: `Failed to overwrite: ${e?.message || 'Unknown error'}` })
    } finally {
      setBusy(false)
    }
  }

  const onMergeEdit = (c) => {
    setMergeFor({ ...c, result: c.incoming })
  }

  const onSaveMerge = async (merged) => {
    if (!mergeFor) return
    const { entity, key } = mergeFor
    try {
      setBusy(true)
      await apiResolveOne(entity, key, merged)
      // find index to remove
      const idx = items.findIndex(it => it.entity === entity && String(it.key) === String(key))
      if (idx >= 0) removeAtIndex(idx)
      setMergeFor(null)
    } catch (e) {
      console.error(e)
      setInfo({ title: 'Error', message: `Failed to apply merge: ${e?.message || 'Unknown error'}` })
    } finally {
      setBusy(false)
    }
  }

  const exportRemaining = async () => {
    if (!items.length) return
    try {
      setBusy(true)
      const payload = items.map(c => ({ entity: c.entity, key: c.key, data: c.incoming }))
      const blob = await apiExportConflicts(payload)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'conflicts.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setInfo({ title: 'Export Error', message: `Failed to export conflicts: ${e?.message || 'Unknown error'}` })
    } finally {
      setBusy(false)
    }
  }

  const startIdx = (page - 1) * PAGE_SIZE

  return (
    <>
      <Modal
        isOpen={true}
        onRequestClose={onCancel}
        title="Resolve Conflicts"
        initialSize={{ w: 960, h: 520 }}
        footerContent={(
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <button className="tw-btn tw-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="tw-btn tw-btn--ghost" onClick={exportRemaining} disabled={busy || items.length === 0}>Export Remaining</button>
              <div className="text-sm tw-text-muted">{items.length} remaining</div>
            </div>
          </div>
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm">Resolve each conflict by choosing an action. Changes are applied immediately.</div>
          <div className="flex items-center gap-2 text-sm">
            <button className="tw-btn tw-btn--sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{'<'}</button>
            <span>Page {page} / {totalPages}</span>
            <button className="tw-btn tw-btn--sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
          </div>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
          {pageItems.map((c, i) => {
            const globalIdx = startIdx + i
            return (
              <div key={`${c.entity}:${c.key}`} className="tw-panel p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.entity}</div>
                    <div className="text-xs tw-text-muted">{String(c.key)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="tw-btn tw-btn--sm tw-btn--ghost" disabled={busy} onClick={() => onKeepExisting(globalIdx)}>Keep Existing</button>
                    <button className="tw-btn tw-btn--sm" disabled={busy} onClick={() => onOverwrite(globalIdx, c)}>Overwrite</button>
                    <button className="tw-btn tw-btn--sm" disabled={busy} onClick={() => onMergeEdit(c)}>Merge/Edit</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <pre className="text-xs p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded overflow-auto max-h-40">{JSON.stringify(c.existing || {}, null, 2)}</pre>
                  <pre className="text-xs p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded overflow-auto max-h-40">{JSON.stringify(c.incoming || {}, null, 2)}</pre>
                </div>
              </div>
            )
          })}
          {pageItems.length === 0 && (
            <div className="text-sm tw-text-muted">No items on this page.</div>
          )}
        </div>
      </Modal>

      {mergeFor && (
        <MergeEditor
          isOpen={true}
          onRequestClose={() => setMergeFor(null)}
          existing={mergeFor.existing}
          incoming={mergeFor.incoming}
          initialResult={mergeFor.result}
          onSave={onSaveMerge}
        />
      )}

      {info && (
        <Modal
          isOpen={true}
          onRequestClose={() => setInfo(null)}
          title={info.title || 'Information'}
          initialSize={{ w: 520, h: 220 }}
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
    </>
  )
}
