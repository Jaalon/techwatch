package org.jaalon.api;

/**
 * DTO for exporting/importing AI API Keys.
 * Note: contains full apiKey for technical exports/imports.
 */
public record ApiKeyExport(String provider, String name, String baseUrl, String apiKey,
                           String organizationId, String projectId) {}
