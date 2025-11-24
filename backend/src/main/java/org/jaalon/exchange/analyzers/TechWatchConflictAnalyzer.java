package org.jaalon.exchange.analyzers;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.TechWatchExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.services.ZipService;
import org.jaalon.exchange.dto.ConflictItem;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.techwatch.TechWatch;
import org.jaalon.techwatch.TechWatchRepository;

import java.util.*;

@ApplicationScoped
public class TechWatchConflictAnalyzer implements ConflictAnalyzer {
    @Inject ZipService zipService;
    @Inject TechWatchRepository techWatchRepository;
    @Inject LinkRepository linkRepository;

    @Override
    public List<ConflictItem> analyze(Map<String, byte[]> files) {
        List<ConflictItem> conflicts = new ArrayList<>();
        List<TechWatchExport> techWatchList = zipService.readIfPresent(files, DataExchangeFiles.TECHWATCHES.fileName(), new TypeReference<>(){});
        if (techWatchList != null) {
            for (TechWatchExport te : techWatchList) {
                TechWatch existing = techWatchRepository.find("date", te.date()).firstResult();
                if (existing != null) {
                    LinkedHashSet<String> exUrls = new LinkedHashSet<>();
                    for (Link l : linkRepository.listAll()) {
                        if (l.techWatches != null && l.techWatches.contains(existing)) {
                            exUrls.add(l.url);
                        }
                    }

                    Map<String, Object> ex = new LinkedHashMap<>();
                    ex.put("date", existing.date.toString());
                    ex.put("status", existing.status == null ? null : existing.status.name());
                    ex.put("maxArticles", existing.maxArticles);
                    ex.put("linkUrls", exUrls);

                    Map<String, Object> incomingMap = new LinkedHashMap<>();
                    incomingMap.put("date", te.date().toString());
                    incomingMap.put("status", te.status());
                    incomingMap.put("maxArticles", te.maxArticles());
                    incomingMap.put("linkUrls", new LinkedHashSet<>(te.linkUrls() == null ? Set.of() : te.linkUrls()));

                    if (!Objects.equals(ex, incomingMap)) {
                        conflicts.add(new ConflictItem("TechWatch", te.date().toString(), ex, incomingMap));
                    }
                }
            }
        }
        return conflicts;
    }
}
