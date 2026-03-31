# TechWatch - AI Agent Instructions

## Project Overview

TechWatch is a local-first application for managing the complete lifecycle of technology news monitoring:
- Collect links via browser extension or web UI
- Sort, categorize, and summarize content using LLM models
- Export ready-to-publish TechWatch documents

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Quarkus 3.28.2, Java 21, H2 database, Liquibase |
| Frontend | React 19.1.1, Vite 7.1.7, Tailwind CSS 4 |
| Extension | Webpack 5, Web Extensions API (Manifest V3) |
| Build | Gradle Kotlin DSL |
| AI | LangChain4j with OpenAI-compatible APIs |

## Project Structure

```
.
├── backend/               # REST API (Quarkus)
│   └── src/main/java/org/jaalon/
│       ├── apikey/        # AI API key management
│       ├── config/        # Application configuration
│       ├── exchange/      # Import/export functionality
│       ├── links/         # Link management & summarization
│       ├── llm/           # LLM client configuration
│       ├── promptinstruction/  # AI prompt directives
│       ├── tags/          # Tag management
│       └── techwatch/     # TechWatch cycle management
├── frontend/              # React UI
│   └── src/
│       ├── api/           # Backend API clients
│       ├── components/    # React components
│       │   ├── common/    # Shared components
│       │   ├── general/   # Main layout components
│       │   ├── links/     # Link management UI
│       │   ├── settings/  # Settings/configuration UI
│       │   └── techwatch/ # TechWatch management UI
├── browser-extension/      # Chrome/Opera extension
└── docs/                  # Documentation
```

## Development Commands

### Backend (Quarkus)
```bash
cd backend
./gradlew quarkusDev        # Start in dev mode (hot reload)
./gradlew test              # Run tests
./gradlew build             # Build JAR
./gradlew buildNative       # Build native executable (requires GraalVM)
```

### Frontend (React)
```bash
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start dev server (http://localhost:3000)
npm run build               # Production build
npm run lint                # Run ESLint
```

### Browser Extension
```bash
cd browser-extension
npm install                 # Install dependencies
npm run watch               # Watch mode with auto-rebuild
npm run build               # Production build
```

### Root Level
```bash
./gradlew :frontend:dev     # Frontend dev
./gradlew :browser-extension:dev  # Extension dev
./gradlew clean build       # Clean and build all
```

## Key Conventions

### Backend (Java/Quarkus)
- REST endpoints in `*Resource.java` classes
- Database entities extend Panache active record pattern
- Migrations in `backend/src/main/resources/db/changelog/`
- Configuration via `application.yaml` and `techwatch.properties`
- Use `@Inject` with constructor injection pattern

### Frontend (React)
- Functional components with hooks
- API calls via axios in `src/api/` modules
- Tailwind CSS for styling
- React Router v7 for navigation
- Components organized by feature domain

### Browser Extension
- Manifest V3 format
- Settings stored via `chrome.storage.sync`
- Background service worker for API calls

## Database

- H2 file database at `backend/var/techwatch`
- Schema managed by Liquibase migrations
- If schema issues occur: stop app, delete files in `backend/var/techwatch/`, restart

## API

- Base URL: `http://localhost:8080`
- OpenAPI spec: `http://localhost:8080/openapi`
- Swagger UI: `http://localhost:8080/q/swagger-ui`

## Common Tasks

### Adding a new REST endpoint
1. Backend: Create DTO in `dto/`, add repository method if needed, create/modify Resource class
2. Frontend: Add API function in `src/api/*.js`
3. Frontend: Create/extend React component in appropriate `components/` folder

### Adding a database migration
1. Create changelog file in `backend/src/main/resources/db/changelog/`
2. Add include reference to master changelog

### Modifying the browser extension
1. Edit source in `browser-extension/src/`
2. Run `npm run watch` to rebuild
3. Reload extension in browser

## Code Style

### Backend
- Follow Quarkus/Jakarta EE conventions
- Use Lombok where applicable
- Panache active record pattern for entities

### Frontend
- ESLint with React Hooks rules
- Tailwind CSS for all styling (no custom CSS unless necessary)
- Prop types via JSDoc or TypeScript (if migrated)

## Troubleshooting

- Backend won't start: Check Java 21, port 8080 availability
- Frontend can't connect: Ensure backend is running first
- Extension won't load: Verify all files in `dist/` after build
- Database issues: Delete `backend/var/techwatch/` files and restart

## Git / Version Control

**NEVER run git commands to save code.** This includes:

- `git add`, `git commit`, `git push`
- `gh pr create`, `gh issue create`

**DO NOT commit changes unless explicitly requested by the user.** The user is responsible for committing and pushing code to the repository.
