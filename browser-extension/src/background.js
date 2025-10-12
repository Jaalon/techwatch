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
