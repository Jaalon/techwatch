package org.jaalon.exchange.dto;

import java.util.List;

public record AnalyzeReport(List<Object> newItems, List<ConflictItem> conflicts) {}
