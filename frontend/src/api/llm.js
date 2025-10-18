const BASE = '/api/llm'

export async function listModels(baseUrl, apiKey) {
  const params = new URLSearchParams()
  params.set('baseUrl', baseUrl || '')
  params.set('apiKey', apiKey || '')
  const res = await fetch(`${BASE}/models?${params.toString()}`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return Array.isArray(data?.models) ? data.models : []
}

export async function listConfigs() {
  const res = await fetch(`${BASE}/configs`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createConfig(payload) {
  const res = await fetch(`${BASE}/configs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json()
}

export async function setDefaultConfig(id) {
  const res = await fetch(`${BASE}/configs/${id}/default`, { method: 'PUT' })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  return await res.json()
}

export async function listMistralModels(baseUrl, apiKey) {
  const res = await fetch(`${BASE}/mistral/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl, apiKey })
  })
  const text = await res.text().catch(() => '')
  let json
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  if (res.status === 200) {
    const arr = Array.isArray(json?.data) ? json.data : []
    return arr
  }
  if (res.status === 422) {
    const msg = (json && Array.isArray(json.detail) && json.detail[0] && json.detail[0].msg) ? json.detail[0].msg : (text || 'Unprocessable Entity')
    throw new Error(msg)
  }
  throw new Error(`Failed to fetch models: HTTP ${res.status}`)
}
