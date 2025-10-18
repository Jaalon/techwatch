# TechWatch – Internal Development Guidelines (Junie Notes)

These notes are intended for experienced developers working on this repository. They capture project-specific build, configuration, and testing practices validated in the current Windows environment.

Repository overview (key dirs):
- backend – Quarkus (Java 21), Gradle (Kotlin DSL)
- frontend – React + Vite
- browser-extension – Chrome MV3
- docs – Documentation

1) Backend (Quarkus, Java 21)

Dev/run/build
- Dev mode: from project root
  - cd backend
  - .\gradlew.bat quarkusDev
  - Service available at http://localhost:8080
- Build (JAR):
  - cd backend
  - .\gradlew.bat build

Runtime configuration (application.yaml highlights)
- Port: quarkus.http.port: 8080
- CORS: enabled=true; origins="*" (frontend/dev and browser extension calls are allowed)
- OpenAPI: quarkus.smallrye-openapi.path: /openapi; UI alias at /swagger if the SmallRye OpenAPI UI is enabled
- DB: H2 file database at jdbc:h2:file:./var/techwatch (username sa, empty password)
  - Liquibase migrates at start: db/changelog/db.changelog-master.yaml
  - If schema issues occur locally, you can stop the app and remove the local DB file under var/techwatch, then restart to re-apply migrations
- Logging: default INFO; org.hibernate.SQL also INFO (SQL visible during tests/dev)

Notes
- No external DB services required to run tests; H2 file DB is used.
- Native build hints for org.h2.Driver exist; not relevant for standard local dev.

2) Backend – Testing

Test framework and scope
- JUnit 5 with Quarkus test support (some tests boot Quarkus; others are plain unit tests).
- Use Windows-friendly commands (.\gradlew.bat); run the smallest relevant set.

Run tests
- All tests:
  - cd backend
  - .\gradlew.bat test
- One test class (pattern supported by Gradle):
  - cd backend
  - .\gradlew.bat test --tests "org.jaalon.*YourTestClass*"
- One exact class:
  - cd backend
  - .\gradlew.bat test --tests "org.jaalon.smoke.QuickSanityTest"
- One test method:
  - cd backend
  - .\gradlew.bat test --tests "org.jaalon.SomeClass.someMethod"

Add a new plain JUnit test (fast, no Quarkus boot)
- Create file: backend/src/test/java/org/jaalon/smoke/QuickSanityTest.java
- Example content (validated locally):

  package org.jaalon.smoke;

  import org.junit.jupiter.api.Test;
  import static org.junit.jupiter.api.Assertions.assertTrue;

  public class QuickSanityTest {
      @Test
      void sanity() {
          assertTrue(true, "Sanity check should pass");
      }
  }

- Run only this test:
  - cd backend
  - .\gradlew.bat test --tests "org.jaalon.smoke.QuickSanityTest"

Quarkus tests (if you need full context)
- Use @QuarkusTest on the class; be aware these tests boot Quarkus and use the H2 DB with Liquibase migrations.

Troubleshooting
- Clean build cache: .\gradlew.bat clean
- Stale DB state: stop app/tests and delete var/techwatch files; rerun to re-migrate.
- Port conflicts: change quarkus.http.port in application.yaml when necessary.
- CI on Windows: always invoke gradlew.bat.

3) Frontend (React + Vite)

Dev and build
- Dev server:
  - cd frontend
  - npm ci
  - npm run dev  (http://localhost:5173)
- Build:
  - cd frontend
  - npm ci
  - npm run build

Testing
- No enforced frontend tests at the moment. If you add tests later, prefer the default Vite/ESBuild/Jest/Vitest setup; document commands in package.json.

4) Browser Extension (Manifest V3)

Build
- If scripts exist:
  - cd browser-extension
  - npm ci
  - npm run build

5) Additional Development/Debugging Notes

- API exploration: use /openapi for the OpenAPI document; Swagger UI may be available at /swagger depending on SmallRye configuration.
- CORS is permissive for local dev; when hardening for prod, review quarkus.http.cors settings.
- SQL visibility: org.hibernate.SQL logging is INFO; leverage logs to debug queries in tests.
- Data location: local H2 DB persists under var/techwatch relative to backend; safe to delete locally between runs.
- Code style:
  - Backend Java: follow Quarkus/Jakarta patterns present in the codebase; keep imports clean and avoid unused code.
  - Frontend: functional React components; keep to Vite defaults and existing file conventions.
- Minimal changes: prefer targeted edits and focused test runs to keep feedback loop fast on Windows.

6) Verified Example (created and removed during this update)

- A minimal JUnit test (QuickSanityTest) under backend/src/test/java/org/jaalon/smoke was created, executed successfully via Gradle on Windows, and then removed to keep the repository clean. The code snippet above is the exact content used.

Last verified on: 2025-10-18 (Windows, PowerShell)
