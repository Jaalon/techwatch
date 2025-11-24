package org.jaalon.exchange.dto;

import java.util.Map;

public record ResolveRequest(String entity, String key, Map<String, Object> data) {}
