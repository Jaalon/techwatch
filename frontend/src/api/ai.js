// API abstraction for AI-related operations
// Placeholder for future integration. Exporting a stub to keep call sites clean.

export async function summarizeLink(linkId) {
  if (!linkId && linkId !== 0) throw new Error('linkId is required')
  const res = await fetch(`/api/links/${encodeURIComponent(String(linkId))}/summarize`, {
    method: 'POST'
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || 'Failed to summarize')
  }
  return await res.json()
}
