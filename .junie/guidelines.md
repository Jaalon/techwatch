# TechWatch – Project Guidelines for Junie

These guidelines tell Junie how to work within this repository: what the project is, how it’s structured, how to run/build/test it on Windows, and when to verify changes.

## Project overview
TechWatch is a local-first application that manages the full lifecycle of a Tech Watch:
- Collect links (manually or via the browser extension)
- Sort and categorize relevant items
- Summarize content with LLMs (local or cloud)
- Generate export-ready outputs (e.g., Confluence-ready text)
- Archive completed Tech Watches

Key points:
- Runs entirely locally
- SQLite for persistence
- ChromaDB for semantic search
- Backend: Quarkus (Java 21)
- Frontend: React + Vite
- Browser extension: Manifest V3

## Repository structure
- backend/ – REST API (Quarkus + Java 21), Gradle (Kotlin DSL)
- frontend/ – React UI (Vite)
- browser-extension/ – Chrome/Opera extension (Manifest V3)
- docs/ – Project documentation
- README.adoc – Full project readme with detailed instructions

## Development prerequisites
- Java 21 (JDK)
- Node.js 18+ with npm
- Git
- Windows PowerShell (paths and commands below assume Windows)

## How Junie should run and test
Always prefer minimal, targeted edits and verify with the smallest relevant set of tests/build steps.

### Backend (Quarkus)
- Dev mode: from project root
  - cd backend
  - .\gradlew.bat quarkusDev
  - Service runs at http://localhost:8080
- Run all tests:
  - cd backend
  - .\gradlew.bat test
- Run one test class:
  - cd backend
  - .\gradlew.bat test --tests "org.jaalon.*YourTestClass*"
- Build (fat JAR):
  - cd backend
  - .\gradlew.bat build

### Frontend (React + Vite)
- Start dev server:
  - cd frontend
  - npm ci
  - npm run dev  (http://localhost:5173)
- Build:
  - cd frontend
  - npm ci
  - npm run build
- Tests: none are enforced at the moment; if present in the future, run via `npm test`.

### Browser extension
- Build (if package scripts are present):
  - cd browser-extension
  - npm ci
  - npm run build

## When Junie should run tests/build
- If you change backend Java/Kotlin code or resources → run backend unit/integration tests.
- If you change build logic or dependencies → run the appropriate build (`gradlew.bat build`).
- If you change frontend logic → at minimum ensure `npm run build` succeeds; run `npm run dev` locally if runtime behavior is affected.
- If your change only adds markdown/docs (like this guidelines file) → tests/build are not required.

## Conventions and code style
- Java (backend):
  - Keep to standard Quarkus/Jakarta idioms.
  - Format code consistently; avoid unused imports and warnings.
  - Prefer constructor or field injection patterns already used in the codebase.
- TypeScript/JavaScript (frontend/extension):
  - Keep code simple and consistent; prefer functional React components.
  - Use existing tooling defaults (Vite/ESBuild). If a formatter is configured, follow it.
- Commits/changes:
  - Make the minimal change set needed to satisfy the issue.
  - Do not rename/move code unless the task requires it.
  - Avoid introducing new dependencies unless necessary.

## Notes for this environment
- Paths use Windows backslashes (\) and Gradle must be run with `gradlew.bat`.
- Prefer specialized tools in this workspace when searching or editing files.

## Quick references
- Backend tests directory: backend/src/test/java
- Backend main code: backend/src/main/java
- Frontend app entry: frontend/src/App.jsx
- Readme: README.adoc for full architecture and instructions
