// Abstraction layer for TechWatch-related API calls

const BASE = '/api/techwatch'

export async function getActiveTechWatch() {
  const res = await fetch(`${BASE}/active`)
  if (res.status === 204) return null
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  return await res.json()
}

export async function listTechWatches() {
  const res = await fetch(BASE)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createTechWatch(payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json().catch(() => null)
}

export async function activateTechWatch(id) {
  return fetch(`${BASE}/${id}/activate`, { method: 'POST' })
}

export async function completeTechWatch(id) {
  return fetch(`${BASE}/${id}/complete`, { method: 'POST' })
}

export async function collectNextLinks(id) {
  return fetch(`${BASE}/${id}/collect-next-links`, { method: 'POST' })
}

export async function getTechWatchLinks(id) {
  const res = await fetch(`${BASE}/${id}/links`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function removeLinkFromTechWatch(twId, linkId) {
  const res = await fetch(`${BASE}/${twId}/links/${linkId}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(await res.text().catch(() => ''))
}