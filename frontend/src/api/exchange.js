import axios from 'axios'

const BASE = '/api/data-exchange'

export async function exportZip(type) {
  const url = `${BASE}/export/${type}`
  const res = await axios.get(url, { responseType: 'blob' })
  return res.data // Blob
}

export async function analyzeZip(file) {
  // Backend expects application/zip body; send raw file as data with correct headers
  const res = await axios.post(`${BASE}/import/analyze`, file, {
    headers: { 'Content-Type': 'application/zip' }
  })
  return res.data // { newItems: [], conflicts: [] }
}

export async function executeZip(file) {
  const res = await axios.post(`${BASE}/import/execute`, file, {
    headers: { 'Content-Type': 'application/zip' }
  })
  return res.status
}

export async function resolveOne(entity, key, data) {
  const res = await axios.post(`${BASE}/import/resolve`, { entity, key, data })
  return res.status
}

export async function exportConflicts(items) {
  const res = await axios.post(`${BASE}/export/conflicts`, items, { responseType: 'blob' })
  return res.data // Blob
}
