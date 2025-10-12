// Options page script for the browser extension
document.addEventListener('DOMContentLoaded', async () => {
    const apiUrlInput = document.getElementById('apiUrl');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    const config = await chrome.storage.local.get(['apiUrl']);
    apiUrlInput.value = config.apiUrl || 'http://localhost:8080';

    // Handle save button
    saveButton.addEventListener('click', async () => {
        const apiUrl = apiUrlInput.value.trim();

        if (!apiUrl) {
            showStatus('Please enter an API URL', 'error');
            return;
        }

        try {
            await chrome.storage.local.set({ apiUrl });
            showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});
