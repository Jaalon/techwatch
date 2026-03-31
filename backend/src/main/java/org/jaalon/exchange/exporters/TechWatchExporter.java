package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.TechWatchExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.techwatch.TechWatch;
import org.jaalon.techwatch.TechWatchRepository;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.jaalon.exchange.ExportType.FUNCTIONAL;

@ApplicationScoped
public class TechWatchExporter implements DataExporter {
    @Inject TechWatchRepository techWatchRepository;
    @Inject LinkRepository linkRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.TECHWATCHES; }

    @Override
    public Object exportData() {
        List<TechWatchExport> out = new ArrayList<>();
        for (TechWatch tw : techWatchRepository.listAll()) {
            List<Link> links = linkRepository.find("select l from Link l join l.techWatches tw where tw.id = ?1", tw.id).list();
            Set<String> urls = new LinkedHashSet<>();
            for (Link l : links) {
                urls.add(l.url);
            }
            out.add(new TechWatchExport(tw.date, tw.status == null ? null : tw.status.name(), tw.maxArticles, urls));
        }
        return out;
    }

    @Override
    public ExportType dataType() {
        return FUNCTIONAL;
    }
}
