package org.jaalon.api;

public record ConflictItem(String entity, String key, Object existing, Object incoming) {}
