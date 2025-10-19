// Popup script for the browser extension
document.addEventListener('DOMContentLoaded', async () => {
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const descriptionInput = document.getElementById('description');
    const markdownInput = document.getElementById('markdown');
    const markdownHint = document.getElementById('markdownHint');
    const addButton = document.getElementById('addButton');
    const statusDiv = document.getElementById('status');
    const optionsLink = document.getElementById('optionsLink');

    let lastExtract = { markdown: null, lastModified: null, nonTextual: false };

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        titleInput.value = tab.title || '';
        urlInput.value = tab.url || '';

        // Ask content script to extract article markdown
        try {
            markdownHint.textContent = 'Extraction en cours…';
            const resp = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
            if (resp && resp.success) {
                const data = resp.data || {};
                lastExtract = {
                    markdown: data.markdown || null,
                    lastModified: data.lastModified || null,
                    nonTextual: !!data.nonTextual
                };
                if (data.title && !titleInput.value) {
                    titleInput.value = data.title;
                }
                if (typeof data.description === 'string' && !descriptionInput.value) {
                    descriptionInput.value = data.description;
                }
                markdownInput.value = data.markdown || '';
                if (data.nonTextual) {
                    markdownHint.textContent = "Page détectée comme principalement non textuelle (vidéo, etc.). Aucun Markdown extrait.";
                } else if (data.markdown) {
                    markdownHint.textContent = 'Contenu extrait. Vous pouvez le modifier avant envoi.';
                } else {
                    markdownHint.textContent = "Aucun contenu principal n'a été détecté sur cette page.";
                }
            } else {
                markdownHint.textContent = 'Échec de lextraction.';
            }
        } catch (e) {
            markdownHint.textContent = `Erreur lors de lextraction: ${e.message}`;
        }
    }

    // Handle add button click
    addButton.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!title || !url) {
            showStatus('Please fill in title and URL', 'error');
            return;
        }

        try {
            addButton.disabled = true;
            showStatus('Saving link...', 'info');

            // ✅ Use only upsertContent (handles both creation and content upload)
            const markdown = (markdownInput.value || '').trim();

            const response = await chrome.runtime.sendMessage({
                action: 'upsertContent',
                data: {
                    url,
                    title,
                    description,
                    markdown,  // Will be converted to 'content' in background.js
                    lastModified: lastExtract.lastModified || null,
                    nonTextual: !!lastExtract.nonTextual
                }
            });

            if (response.success) {
                showStatus('Link and content saved successfully!', 'success');
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
