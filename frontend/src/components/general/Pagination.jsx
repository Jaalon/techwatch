import React from 'react'

/**
 * A generic pagination component.
 * 
 * @param {number} page - Current page (0-based)
 * @param {number} size - Number of items per page
 * @param {number} total - Total number of items
 * @param {function} onPageChange - Callback when page changes (receives new 0-based page index)
 * @param {string} showingLabel - Label for "Showing" (default: "Showing")
 * @param {string} ofLabel - Label for "of" (default: "of")
 * @param {string} noItemsLabel - Label when no items found (default: "No items found")
 * @param {string} previousTitle - Tooltip for Previous button (default: "Previous")
 * @param {string} nextTitle - Tooltip for Next button (default: "Next")
 * @param {string} pageLabel - Label for "Page" (default: "Page")
 */
export default function Pagination({
  page,
  size,
  total,
  onPageChange,
  showingLabel = 'Showing',
  ofLabel = 'of',
  noItemsLabel = 'No items found',
  previousTitle = 'Previous',
  nextTitle = 'Next',
  pageLabel = 'Page'
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, size)))
  const start = page * size
  const end = Math.min(start + size, total)

  return (
    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
      <div>
        {total > 0 ? (
          <span>
            {showingLabel} {start + 1}-{end} {ofLabel} {total}
          </span>
        ) : (
          <span>{noItemsLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="tw-btn text-xs"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page <= 0}
          title={previousTitle}
        >
          ◀
        </button>
        <span>
          {pageLabel} {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="tw-btn"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          title={nextTitle}
        >
          ▶
        </button>
      </div>
    </div>
  )
}
