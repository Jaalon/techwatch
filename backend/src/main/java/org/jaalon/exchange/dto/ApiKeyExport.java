package org.jaalon.exchange.dto;

public record ApiKeyExport(String provider, String name, String baseUrl, String apiKey,
                           String organizationId, String projectId) {}
