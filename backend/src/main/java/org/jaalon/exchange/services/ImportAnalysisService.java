package org.jaalon.exchange.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.AnalyzeReport;
import org.jaalon.exchange.dto.ConflictItem;
import org.jaalon.exchange.analyzers.ConflictAnalyzer;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ImportAnalysisService {

    @Inject
    ZipService zipService;
    @Inject Instance<ConflictAnalyzer> analyzers;

    public AnalyzeReport analyzeZip(InputStream inputStream) {
        Map<String, byte[]> files = zipService.readZipToMap(inputStream);

        List<ConflictItem> conflicts = new ArrayList<>();
        for (ConflictAnalyzer analyzer : analyzers) {
            conflicts.addAll(analyzer.analyze(files));
        }

        return new AnalyzeReport(List.of(), conflicts);
    }
}
