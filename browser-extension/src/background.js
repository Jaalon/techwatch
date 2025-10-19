// Background service worker for the browser extension
console.log('Tech Watch Extension - Background service worker loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tech Watch Extension installed');
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'addLink') {
        handleAddLink(request.data)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    }
    if (request.action === 'upsertContent') {
        handleUpsertContent(request.data)
            .then(response => sendResponse({ success: true, data: response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function handleAddLink(linkData) {
    const config = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = config.apiUrl || 'http://localhost:8080';

    const response = await fetch(`${apiUrl}/api/links`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function handleUpsertContent(payload) {
    const config = await chrome.storage.local.get(['apiUrl']);
    const apiUrl = config.apiUrl || 'http://localhost:8080';

    // Normalize fields for backend DTO compatibility
    const url = payload?.url || '';
    const title = payload?.title || null;
    const description = payload?.description || null;

    // Prefer explicit content if provided; otherwise use markdown. Trim empty strings to null.
    let content = null;
    if (typeof payload?.content === 'string') {
        const trimmed = payload.content.trim();
        content = trimmed.length ? trimmed : null;
    } else if (typeof payload?.markdown === 'string') {
        const trimmed = payload.markdown.trim();
        content = trimmed.length ? trimmed : null;
    }

    // Coerce lastModified into ISO-8601 string if provided as number/date/string; else null
    let lastModified = null;
    if (payload && payload.lastModified != null) {
        if (typeof payload.lastModified === 'number') {
            const d = new Date(payload.lastModified);
            if (!isNaN(d.getTime())) lastModified = d.toISOString();
        } else if (typeof payload.lastModified === 'string') {
            const d = new Date(payload.lastModified);
            if (!isNaN(d.getTime())) lastModified = d.toISOString();
        } else if (payload.lastModified instanceof Date) {
            if (!isNaN(payload.lastModified.getTime())) lastModified = payload.lastModified.toISOString();
        }
    }

    const nonTextual = !!payload?.nonTextual;

    const body = { url, title, description, content, lastModified, nonTextual };

    const response = await fetch(`${apiUrl}/api/links/upsert-content`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}
