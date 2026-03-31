package org.jaalon.exchange.dto;

import java.util.Set;

public record LinkExport(String title, String url, String description, String summary, String status,
                         Set<String> tags) { }
