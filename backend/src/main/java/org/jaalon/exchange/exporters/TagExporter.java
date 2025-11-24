package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;
import org.jaalon.exchange.dto.TagExport;
import org.jaalon.tags.Tag;
import org.jaalon.tags.TagRepository;

import java.util.ArrayList;
import java.util.List;

import static org.jaalon.exchange.ExportType.FUNCTIONAL;

@ApplicationScoped
public class TagExporter implements DataExporter {
    @Inject TagRepository tagRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.TAGS; }

    @Override
    public Object exportData() {
        List<TagExport> out = new ArrayList<>();
        for (Tag t : tagRepository.listAll()) {
            out.add(new TagExport(t.name));
        }
        return out;
    }

    @Override
    public ExportType dataType() {
        return FUNCTIONAL;
    }
}
