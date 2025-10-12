// Popup script for the browser extension
document.addEventListener('DOMContentLoaded', async () => {
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const descriptionInput = document.getElementById('description');
    const addButton = document.getElementById('addButton');
    const statusDiv = document.getElementById('status');
    const optionsLink = document.getElementById('optionsLink');

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        titleInput.value = tab.title || '';
        urlInput.value = tab.url || '';
    }

    // Handle add button click
    addButton.addEventListener('click', async () => {
        const linkData = {
            title: titleInput.value.trim(),
            url: urlInput.value.trim(),
            description: descriptionInput.value.trim()
        };

        if (!linkData.title || !linkData.url) {
            showStatus('Please fill in title and URL', 'error');
            return;
        }

        try {
            addButton.disabled = true;
            showStatus('Adding link...', 'info');

            const response = await chrome.runtime.sendMessage({
                action: 'addLink',
                data: linkData
            });

            if (response.success) {
                showStatus('Link added successfully!', 'success');
                setTimeout(() => window.close(), 1500);
            } else {
                showStatus(`Error: ${response.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            addButton.disabled = false;
        }
    });

    // Handle options link
    optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
    }
});
