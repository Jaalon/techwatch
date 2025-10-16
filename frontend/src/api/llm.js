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
