package org.jaalon.exchange.dto;

public record ConflictItem(String entity, String key, Object existing, Object incoming) {}
