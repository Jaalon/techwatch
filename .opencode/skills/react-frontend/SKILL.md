---
name: react-frontend
description: React frontend development for TechWatch application
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: frontend
---

## Overview

The TechWatch frontend is built with React 19.1.1, Vite 7.1.7, and Tailwind CSS 4. It provides the user interface for managing links, categories, TechWatch cycles, and LLM settings.

## Project Structure

```
frontend/src/
├── api/           # Backend API clients (axios)
│   ├── ai.js      # AI settings endpoints
│   ├── aikeys.js  # API key management
│   ├── exchange.js # Import/export
│   ├── links.js   # Link CRUD operations
│   ├── llm.js     # LLM configuration
│   └── techwatch.js # TechWatch management
├── components/
│   ├── common/    # Shared (Modal, DeleteConfirmModal)
│   ├── general/   # Layout (ContentComponent, MainPage, MenuComponent)
│   ├── links/     # Link management UI
│   │   ├── AddLinkModal.jsx
│   │   ├── LinkContentModal.jsx
│   │   ├── LinkEditModal.jsx
│   │   ├── LinkItem.jsx
│   │   ├── LinkListComponent.jsx
│   │   └── LinksPage.jsx
│   ├── settings/  # Configuration UI
│   │   ├── AddDockerProviderModal.jsx
│   │   ├── AddModelModal.jsx
│   │   ├── AiApiKeysSection.jsx
│   │   ├── ImportExportComponent.jsx
│   │   ├── PromptDirectivesComponent.jsx
│   │   └── SettingsPage.jsx
│   └── techwatch/ # TechWatch UI
│       ├── GroupedByCategoryView.jsx
│       ├── MarkdownExportModal.jsx
│       ├── TechWatchComponent.jsx
│       └── TechWatchList.jsx
├── App.jsx        # Main app with routing
└── config.js      # API configuration
```

## Key Conventions

### Components
- Functional components with React hooks
- Props passed explicitly
- Organized by feature domain

### Styling
- Tailwind CSS for all styling
- No custom CSS unless necessary
- Use existing utility classes

### API Integration
- Axios for HTTP requests
- API modules in `src/api/`
- Base URL configured in `config.js`

## Development

### Start Dev Server
```bash
cd frontend
npm install  # First time only
npm run dev  # http://localhost:3000
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build  # Outputs to frontend/dist/
```

## Code Style
- ESLint with React Hooks rules
- Use functional components
- Avoid class components
- Clear component names reflecting their purpose

## API Proxy
Vite proxies `/api/*` requests to `http://localhost:8080` during development.
