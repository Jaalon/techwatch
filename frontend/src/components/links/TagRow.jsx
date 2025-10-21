import React from 'react'
import { addTag as apiAddTag, removeTag as apiRemoveTag, searchTags as apiSearchTags } from '../../api/links'

export default function TagRow({ linkId, initialTags, className = '', onChange }) {
  const [tags, setTags] = React.useState(Array.isArray(initialTags) ? [...initialTags] : [])
  const [tagInput, setTagInput] = React.useState('')
  const [tagOptions, setTagOptions] = React.useState([])

  React.useEffect(() => {
    setTags(Array.isArray(initialTags) ? [...initialTags] : [])
    setTagInput('')
    setTagOptions([])
  }, [linkId, JSON.stringify((initialTags || []).map(t => (t?.name || t)))])

  const removeTag = async (name) => {
    try {
      await apiRemoveTag(linkId, name)
    } catch (e) {
      console.error(e)
    } finally {
      setTags(prev => {
        const next = prev.filter(x => (x.name || x) !== name)
        try { onChange && onChange(next) } catch {}
        return next
      })
    }
  }

  const addTag = async (name) => {
    const clean = (name || '').trim()
    if (!clean) return
    try {
      await apiAddTag(linkId, clean)
      setTags(prev => {
        const exists = prev.some(x => (x.name || x) === clean)
        const next = exists ? prev : [...prev, { name: clean }]
        try { onChange && onChange(next) } catch {}
        return next
      })
      setTagInput('')
      setTagOptions([])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className={("" + className).trim()}>
      <div className="flex flex-wrap items-center gap-2">
        {(tags || []).map(t => {
          const name = typeof t === 'string' ? t : t.name
          return (
            <span key={t.id || name}
                  title="Click to remove"
                  onClick={() => removeTag(name)}
                  className="tw-tag cursor-pointer select-none">
              {name}
            </span>
          )
        })}

        <div className="ml-auto inline-flex items-center gap-1 min-w-[12rem]">
          <input
            list={`edit-tag-options-${linkId}`}
            placeholder="Add tag..."
            className="tw-input w-full"
            value={tagInput}
            onChange={async (e) => {
              const v = e.target.value
              setTagInput(v)
              try {
                if (!v) { setTagOptions([]); return }
                const opts = await apiSearchTags(v, 10)
                setTagOptions(Array.isArray(opts) ? opts : [])
              } catch(err) { console.error(err) }
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                await addTag(tagInput)
              }
            }}
          />
          <datalist id={`edit-tag-options-${linkId}`}>
            {(tagOptions || []).map(opt => (
              <option key={opt.id || opt.name} value={opt.name} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  )
}
