package org.jaalon.exchange.analyzers;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.LinkExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.services.ZipService;
import org.jaalon.exchange.dto.ConflictItem;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.tags.Tag;

import java.util.*;

@ApplicationScoped
public class LinkConflictAnalyzer implements ConflictAnalyzer {
    @Inject ZipService zipService;
    @Inject LinkRepository linkRepository;

    @Override
    public List<ConflictItem> analyze(Map<String, byte[]> files) {
        List<ConflictItem> conflicts = new ArrayList<>();
        List<LinkExport> exportedLinkList = zipService.readIfPresent(files, DataExchangeFiles.LINKS.fileName(), new TypeReference<>(){});
        if (exportedLinkList != null) {
            for (LinkExport exportedLink : exportedLinkList) {
                Link existing = linkRepository.find("url", exportedLink.url()).firstResult();
                if (existing != null) {
                    LinkedHashSet<String> exTags = new LinkedHashSet<>();
                    if (existing.tags != null) for (Tag t : existing.tags) exTags.add(t.name);
                    Map<String, Object> ex = new LinkedHashMap<>();
                    ex.put("url", existing.url);
                    ex.put("title", existing.title);
                    ex.put("description", existing.description);
                    ex.put("summary", existing.summary);
                    ex.put("tags", exTags);

                    Map<String, Object> incomingMap = new LinkedHashMap<>();
                    incomingMap.put("url", exportedLink.url());
                    incomingMap.put("title", exportedLink.title());
                    incomingMap.put("description", exportedLink.description());
                    incomingMap.put("summary", exportedLink.summary());
                    incomingMap.put("tags", new LinkedHashSet<>(exportedLink.tags() == null ? Set.of() : exportedLink.tags()));

                    if (!Objects.equals(ex, incomingMap)) {
                        conflicts.add(new ConflictItem("Link", exportedLink.url(), ex, incomingMap));
                    }
                }
            }
        }
        return conflicts;
    }
}
