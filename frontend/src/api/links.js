// Abstraction layer for Links-related API calls

const BASE = '/api/links'

export async function listLinks({ status, q, page = 0, size = 10, sort = 'date' } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  params.set('page', String(page))
  params.set('size', String(size))
  if (sort) params.set('sort', sort)
  const res = await fetch(`${BASE}?${params.toString()}`)
  const totalCountHeader = res.headers.get('X-Total-Count')
  const total = totalCountHeader ? parseInt(totalCountHeader, 10) : undefined
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  const data = await res.json()
  return { items: Array.isArray(data) ? data : [], total }
}

export async function createLink(payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || 'API error')
  }
  return await res.json().catch(() => null)
}

export async function deleteLink(id) {
  return fetch(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function updateLinkStatus(id, status) {
  return fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
}

export async function assignToNext(id) {
  return fetch(`${BASE}/${id}/assign-next`, { method: 'POST' })
}

export async function addTag(id, name) {
  const res = await fetch(`${BASE}/${id}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
}

export async function removeTag(id, name) {
  const res = await fetch(`${BASE}/${id}/tags/${encodeURIComponent(name)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
}

export async function searchTags(q, limit = 10) {
  const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(String(limit))}`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function updateLinkDescription(id, description) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
}

// Generic update allowing title/url/description/status etc.
export async function updateLink(id, payload) {
  const body = payload && typeof payload === 'object' ? payload : {}
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
}

export async function invalidateSummary(id) {
  const res = await fetch(`${BASE}/${id}/summary`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json().catch(() => null)
}

export async function getLink(id) {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  return await res.json()
}

// Returns true if the link already belongs to an ACTIVE TechWatch
export async function getLinkInActiveTechWatch(id) {
  const res = await fetch(`${BASE}/${id}/in-active-techwatch`)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  return !!(data && data.inActiveTechWatch)
}

// Returns true if the link belongs to any TechWatch (any status)
export async function getLinkInAnyTechWatch(id) {
  const res = await fetch(`${BASE}/${id}/in-any-techwatch`)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Server error (${res.status})`)
  }
  const data = await res.json().catch(() => null)
  return !!(data && data.inAnyTechWatch)
}
