---
name: java-quarkus-backend
description: Java/Quarkus backend development for TechWatch application
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: backend
---

## Overview

The TechWatch backend is built with Quarkus 3.28.2 and Java 21. It provides REST APIs for link management, LLM integration, and TechWatch cycle management.

## Project Structure

```
backend/src/main/java/org/jaalon/
├── apikey/        # AI API key management (AiApiKey, AiApiKeyResource)
├── config/        # Application configuration (ConfigResource, CorsConfig, StartupInit)
├── exchange/      # Import/export functionality (exporters/, analyzers/)
├── links/         # Link management (Link, LinkResource, SummarizationService)
├── llm/           # LLM client (LlmClient, LlmConfig)
├── promptinstruction/  # AI prompt directives (PromptInstruction)
├── tags/          # Tag management (Tag, TagResource)
└── techwatch/     # TechWatch cycle (TechWatch, TechWatchResource, TechWatchService)
```

## Key Conventions

### REST Endpoints
- Resource classes end with `*Resource.java`
- Use constructor injection with `@Inject`
- Return DTOs for API responses

### Database Entities
- Entities extend Panache active record pattern
- Repository classes for complex queries
- Liquibase migrations in `src/main/resources/db/changelog/`

### Configuration
- Main config: `application.yaml` (Quarkus standard)
- App config: `techwatch.properties` (custom properties)
- Use `@ConfigProperty` for injection

## Common Tasks

### Adding a New REST Endpoint
1. Create DTO class in `*/dto/` package
2. Add repository method if needed
3. Create/modify Resource class with `@Path` annotation
4. Add Liquibase migration if schema changes

### Database Migrations
1. Create changelog in `src/main/resources/db/changelog/`
2. Add include to master changelog
3. Test with `backend/var/techwatch/` deleted

### Running Development
```bash
cd backend
./gradlew quarkusDev  # Hot reload enabled
```

### Running Tests
```bash
cd backend
./gradlew test
```

## Code Style
- Use Lombok annotations where applicable
- Follow Quarkus/Jakarta EE conventions
- Panache active record pattern for entities
- UTF-8 encoding for all source files

## API Base URL
- Development: `http://localhost:8080`
- OpenAPI spec: `http://localhost:8080/openapi`
- Swagger UI: `http://localhost:8080/q/swagger-ui`
