package org.jaalon.api;

import java.time.LocalDate;
import java.util.Set;

public record TechWatchExport(LocalDate date, String status, Integer maxArticles, Set<String> linkUrls) {}
