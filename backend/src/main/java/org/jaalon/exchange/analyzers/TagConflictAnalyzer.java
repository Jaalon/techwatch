package org.jaalon.exchange.analyzers;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.ConflictItem;
import org.jaalon.exchange.dto.TagExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.services.ZipService;
import org.jaalon.tags.Tag;
import org.jaalon.tags.TagRepository;

import java.util.*;

@ApplicationScoped
public class TagConflictAnalyzer implements ConflictAnalyzer {
    @Inject ZipService zipService;
    @Inject TagRepository tagRepository;

    @Override
    public List<ConflictItem> analyze(Map<String, byte[]> files) {
        List<ConflictItem> conflicts = new ArrayList<>();
        List<TagExport> tags = zipService.readIfPresent(files, DataExchangeFiles.TAGS.fileName(), new TypeReference<>(){});
        if (tags != null) {
            for (TagExport t : tags) {
                Tag existing = tagRepository.find("name", t.name()).firstResult();
                if (existing != null) {
                    Map<String, Object> ex = Map.of("name", existing.name);
                    Map<String, Object> incomingMap = Map.of("name", t.name());
                    if (!Objects.equals(ex, incomingMap)) {
                        conflicts.add(new ConflictItem("Tag", t.name(), ex, incomingMap));
                    }
                }
            }
        }
        return conflicts;
    }
}
