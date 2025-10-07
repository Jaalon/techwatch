export async function getBackendUrl() {
    const result = await chrome.storage.local.get(['backendPort']);
    const port = result.backendPort || '8080';
    return `http://localhost:${port}`;
}

export async function setBackendPort(port) {
    await chrome.storage.local.set({ backendPort: port });
}
