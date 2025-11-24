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
            Set<String> urls = new LinkedHashSet<>();
            for (Link l : linkRepository.listAll()) {
                if (l.techWatches != null && l.techWatches.contains(tw)) {
                    urls.add(l.url);
                }
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
