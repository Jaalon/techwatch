package org.jaalon.api;

import java.util.Set;

public record LinkExport(String title, String url, String description, String summary,
                         Set<String> tags) {}
