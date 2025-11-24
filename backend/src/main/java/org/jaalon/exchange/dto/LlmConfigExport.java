package org.jaalon.exchange.dto;

public record LlmConfigExport(String name, String provider, String apiKeyName, String model, boolean isDefault) {}
