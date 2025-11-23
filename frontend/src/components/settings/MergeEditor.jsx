import React from 'react'
import Modal from '../common/Modal.jsx'

export default function MergeEditor({ isOpen, onRequestClose, existing = {}, incoming = {}, initialResult = {}, onSave }) {
  const [text, setText] = React.useState(JSON.stringify(initialResult ?? incoming ?? {}, null, 2))
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    setText(JSON.stringify(initialResult ?? incoming ?? {}, null, 2))
    setError('')
  }, [initialResult, incoming, isOpen])

  const trySave = () => {
    try {
      const obj = JSON.parse(text)
      onSave?.(obj)
      onRequestClose?.()
    } catch (e) {
      setError('Invalid JSON: ' + (e?.message || ''))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      title="Merge/Edit"
      initialSize={{ w: 980, h: 560 }}
      footerContent={(
        <div className="flex justify-end gap-2">
          <button className="tw-btn tw-btn--ghost" onClick={onRequestClose}>Cancel</button>
          <button className="tw-btn" onClick={trySave}>Save</button>
        </div>
      )}
    >
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="flex flex-col">
          <div className="text-sm font-medium mb-1">Existing</div>
          <pre className="w-full h-96 overflow-auto p-2 bg-red-50 dark:bg-red-900/20 text-xs rounded border border-red-200 dark:border-red-800">
            {JSON.stringify(existing || {}, null, 2)}
          </pre>
        </div>
          <div className="flex flex-col">
              <div className="text-sm font-medium mb-1">Result</div>
              <textarea className="w-full h-96 p-2 text-xs border rounded bg-white dark:bg-slate-800"
                        value={text} onChange={e => setText(e.target.value)} spellCheck={false} />
              {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
          </div>
        <div className="flex flex-col">
          <div className="text-sm font-medium mb-1">Incoming</div>
          <pre className="w-full h-96 overflow-auto p-2 bg-green-50 dark:bg-green-900/20 text-xs rounded border border-green-200 dark:border-green-800">
            {JSON.stringify(incoming || {}, null, 2)}
          </pre>
        </div>
      </div>
    </Modal>
  )
}
