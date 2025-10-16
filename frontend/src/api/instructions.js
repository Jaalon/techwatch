const BASE = '/api/instructions'

export async function getSummarizeInstruction() {
  const res = await fetch(`${BASE}/summarize`)
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return data?.content || ''
}

export async function saveSummarizeInstruction(content) {
  const res = await fetch(`${BASE}/summarize`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  if (!res.ok) throw new Error(await res.text().catch(() => ''))
  const data = await res.json()
  return data?.content || ''
}
