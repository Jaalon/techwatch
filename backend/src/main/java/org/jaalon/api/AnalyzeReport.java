package org.jaalon.api;

import java.util.List;

public record AnalyzeReport(List<Object> newItems, List<ConflictItem> conflicts) {}
