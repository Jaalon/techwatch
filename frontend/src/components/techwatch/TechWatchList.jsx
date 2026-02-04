import React, { useEffect, useMemo, useState } from 'react'
import TechWatchItem from './TechWatchItem'
import Pagination from '../general/Pagination'

function TechWatchList({ items, onOpen, max = 5, pageSize }) {
  const size = pageSize ?? max
  const safeItems = Array.isArray(items) ? items : []

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('') // '' = all
  const [fromDate, setFromDate] = useState('') // yyyy-MM-dd
  const [toDate, setToDate] = useState('') // yyyy-MM-dd
  const [sortKey, setSortKey] = useState('date') // 'date' | 'status'
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'

  const [page, setPage] = useState(0)

  const uniqueStatuses = useMemo(() => {
    const s = new Set()
    for (const it of safeItems) {
      if (it?.status) s.add(String(it.status))
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [safeItems])

  const parseDate = (d) => {
    if (!d) return null
    const dt = new Date(d)
    return isNaN(dt) ? null : dt
  }

  const fromDateObj = fromDate ? parseDate(fromDate) : null
  const toDateObj = toDate ? parseDate(toDate) : null

  const filteredSortedItems = useMemo(() => {
    const arr = safeItems.filter(it => {
      // status filter
      if (statusFilter && String(it?.status) !== statusFilter) return false
      // date range filter (inclusive)
      const dt = parseDate(it?.date)
      if (!(fromDateObj && (!dt || dt < new Date(fromDate + 'T00:00:00')))) {
        return !(toDateObj && (!dt || dt > new Date(toDate + 'T23:59:59')));
      } else {
        return false
      }

    })

    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'status') {
        const sa = String(a?.status ?? '')
        const sb = String(b?.status ?? '')
        cmp = sa.localeCompare(sb)
      } else {
        const da = parseDate(a?.date)
        const db = parseDate(b?.date)
        const ta = da ? da.getTime() : -Infinity
        const tb = db ? db.getTime() : -Infinity
        cmp = ta === tb ? 0 : (ta < tb ? -1 : 1)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return arr
  }, [safeItems, statusFilter, fromDate, toDate, sortKey, sortDir])

  const total = filteredSortedItems.length
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, size)))
  const clampedPage = Math.min(page, totalPages - 1)
  const safeClampedPage = Math.max(0, clampedPage)
  const start = safeClampedPage * size
  const end = start + size
  const list = filteredSortedItems.slice(start, end)

  useEffect(() => {
    // Reset page if items shrink or pageSize/filters change so that page stays in range
    const newTotalPages = Math.max(1, Math.ceil(total / Math.max(1, size)))
    if (page >= newTotalPages) {
      setPage(Math.max(0, newTotalPages - 1))
    }
    if (total === 0 && page !== 0) {
      setPage(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, size])

  // When filters change, go back to page 0 for better UX
  useEffect(() => {
    setPage(0)
  }, [statusFilter, fromDate, toDate, sortKey, sortDir])

  return (
    <div>
      <div className="mb-2">
        <strong>Recent TechWatch</strong>
      </div>

      {/* Filter & sort bar */}
      <div className="mt-2 mb-2 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Statut</span>
          <select className="tw-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">À partir du</span>
          <input className="tw-input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Jusqu'au</span>
          <input className="tw-input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Tri</span>
          <div className="flex gap-2">
            <select className="tw-input" value={sortKey} onChange={e => setSortKey(e.target.value)}>
              <option value="date">Date</option>
              <option value="status">Statut</option>
            </select>
            <select className="tw-input" value={sortDir} onChange={e => setSortDir(e.target.value)}>
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
          </div>
        </label>
        {(statusFilter || fromDate || toDate || sortKey !== 'date' || sortDir !== 'desc') && (
          <button type="button" className="tw-btn" onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); setSortKey('date'); setSortDir('desc') }}>Réinitialiser</button>
        )}
      </div>

      <section className="mb-3 tw-searchbar p-2 rounded">
        <ul className="list-none p-0 tw-divide-y tw-list">
          {list.map(m => (
            <TechWatchItem key={m.id} item={m} onOpen={onOpen} />
          ))}
        </ul>
      </section>

      <Pagination
        page={safeClampedPage}
        size={size}
        total={total}
        onPageChange={setPage}
        showingLabel="Affichage"
        ofLabel="sur"
        noItemsLabel="Aucun élément"
        previousTitle="Précédent"
        nextTitle="Suivant"
      />
    </div>
  )
}

export default TechWatchList
