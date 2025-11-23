package org.jaalon.api;

public record LlmConfigExport(String name, String provider, String apiKeyName, String model, boolean isDefault) {}
