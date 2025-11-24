package org.jaalon.exchange.analyzers;

import org.jaalon.exchange.dto.ConflictItem;

import java.util.List;
import java.util.Map;

public interface ConflictAnalyzer {
    List<ConflictItem> analyze(Map<String, byte[]> files);
}
