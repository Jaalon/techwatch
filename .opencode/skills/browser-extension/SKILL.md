---
name: browser-extension
description: Browser extension development for TechWatch
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: extension
---

## Overview

The TechWatch browser extension allows users to collect links from any webpage. It uses Webpack 5 and Manifest V3 format.

## Project Structure

```
browser-extension/
├── src/
│   ├── background.js      # Service worker
│   ├── popup.js          # Extension popup
│   ├── popup.html        # Popup UI
│   ├── options.js        # Settings page
│   ├── options.html      # Settings UI
│   ├── config.js         # Configuration
│   └── manifest.json     # Manifest V3
├── dist/                  # Build output
├── webpack.config.js      # Webpack configuration
└── package.json
```

## Key Conventions

### Manifest V3
- Uses `chrome.storage.sync` for settings
- Background service worker for API calls
- Popup for quick link submission

### Settings Storage
```javascript
// Default settings
{
  apiUrl: "http://localhost:8080",
  // User-configurable API endpoint
}
```

## Development

### Install Dependencies
```bash
cd browser-extension
npm install
```

### Watch Mode (Auto-rebuild)
```bash
npm run watch
```

### Production Build
```bash
npm run build  # Outputs to browser-extension/dist/
```

## Loading Extension

### Chrome
1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `browser-extension/dist/`

### Opera
1. Open `opera://extensions/`
2. Enable Developer mode
3. Click "Load unpacked extension"
4. Select `browser-extension/dist/`

## After Rebuild
Click the reload icon on the extension card in browser's extension manager.

## Common Issues
- Missing dist files: Run `npm run build` first
- API connection: Verify backend running on configured port
- CORS errors: Check backend CORS configuration allows extension origin
