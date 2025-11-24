package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.LinkExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.tags.Tag;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.jaalon.exchange.ExportType.FUNCTIONAL;

@ApplicationScoped
public class LinkExporter implements DataExporter {
    @Inject LinkRepository linkRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.LINKS; }

    @Override
    public Object exportData() {
        List<LinkExport> out = new ArrayList<>();
        for (Link l : linkRepository.listAll()) {
            Set<String> t = new LinkedHashSet<>();
            if (l.tags != null) {
                for (Tag tag : l.tags) t.add(tag.name);
            }
            out.add(new LinkExport(l.title, l.url, l.description, l.summary, t));
        }
        return out;
    }

    @Override
    public ExportType dataType() {
        return FUNCTIONAL;
    }
}
