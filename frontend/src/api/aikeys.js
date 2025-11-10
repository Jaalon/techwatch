const BASE = '/api/ai-keys'

export async function listKeys() {
  const res = await fetch(`${BASE}`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createKey(payload) {
  const res = await fetch(`${BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json()
}

export async function updateKey(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json()
}

export async function deleteKey(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (res.status === 204) return true
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return true
}

export async function getKey(id) {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json()
}
