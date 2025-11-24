package org.jaalon.exchange.services;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.jaalon.apikey.AiApiKey;
import org.jaalon.apikey.AiApiKeyRepository;
import org.jaalon.promptinstruction.PromptInstruction;
import org.jaalon.promptinstruction.PromptInstructionRepository;
import org.jaalon.exchange.dto.*;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.tags.Tag;
import org.jaalon.tags.TagRepository;
import org.jaalon.techwatch.TechWatch;
import org.jaalon.techwatch.TechWatchRepository;
import org.jaalon.techwatch.TechWatchStatus;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;

import static org.jaalon.exchange.DataExchangeFiles.*;

@ApplicationScoped
public class ImportExecutionService {

    @Inject
    ZipService zipService;
    @Inject AiApiKeyRepository aiApiKeyRepository;
    @Inject PromptInstructionRepository promptRepository;
    @Inject LinkRepository linkRepository;
    @Inject TechWatchRepository techWatchRepository;
    @Inject TagRepository tagRepository;

    public void resolveOne(ResolveRequest req) {
        if (req == null || req.entity() == null) throw new BadRequestException("Missing entity");
        switch (req.entity()) {
            case "PromptInstruction" -> {
                if (req.key() == null) throw new BadRequestException("Missing key for PromptInstruction");
                String content = valueAsString(req.data(), "content");
                PromptInstruction pi = promptRepository.findById(req.key());
                if (pi == null) {
                    pi = new PromptInstruction();
                    pi.type = req.key();
                    pi.content = content;
                    promptRepository.persist(pi);
                } else {
                    pi.content = content;
                }
            }
            case "AiApiKey" -> {
                String[] parts = req.key() != null ? req.key().split(":", 2) : null;
                if (parts == null || parts.length != 2) throw new BadRequestException("AiApiKey key must be 'provider:name'");
                String provider = parts[0];
                String name = parts[1];
                AiApiKey existing = aiApiKeyRepository.find("provider = ?1 and name = ?2", provider, name).firstResult();
                if (existing == null) {
                    AiApiKey n = new AiApiKey();
                    n.provider = provider;
                    n.name = name;
                    n.baseUrl = valueAsString(req.data(), "baseUrl");
                    n.organizationId = valueAsString(req.data(), "organizationId");
                    n.projectId = valueAsString(req.data(), "projectId");
                    aiApiKeyRepository.persist(n);
                } else {
                    existing.baseUrl = valueAsString(req.data(), "baseUrl");
                    existing.organizationId = valueAsString(req.data(), "organizationId");
                    existing.projectId = valueAsString(req.data(), "projectId");
                }
            }
            case "Link" -> {
                String url = req.key();
                if (url == null) throw new BadRequestException("Missing key (url) for Link");
                Link link = linkRepository.find("url", url).firstResult();
                if (link == null) {
                    link = new Link();
                    link.url = url;
                    linkRepository.persist(link);
                }
                link.title = valueAsString(req.data(), "title");
                link.description = valueAsString(req.data(), "description");
                link.summary = valueAsString(req.data(), "summary");
                Object tagsObj = req.data() != null ? req.data().get("tags") : null;
                if (tagsObj instanceof Collection<?> col) {
                    LinkedHashSet<Tag> newTags = new LinkedHashSet<>();
                    for (Object o : col) {
                        if (o == null) continue;
                        String tn = String.valueOf(o);
                        Tag t = tagRepository.find("name", tn).firstResult();
                        if (t == null) { t = new Tag(); t.name = tn; tagRepository.persist(t); }
                        newTags.add(t);
                    }
                    link.tags = newTags;
                }
            }
            case "TechWatch" -> {
                String dateStr = req.key();
                if (dateStr == null) throw new BadRequestException("Missing key (date) for TechWatch");
                LocalDate date = LocalDate.parse(dateStr);
                TechWatch tw = techWatchRepository.find("date", date).firstResult();
                if (tw == null) { tw = new TechWatch(); tw.date = date; techWatchRepository.persist(tw); }
                String status = valueAsString(req.data(), "status");
                tw.status = safeStatus(status);
                tw.maxArticles = valueAsInteger(req.data());

                Object linkUrlsObj = req.data() != null ? req.data().get("linkUrls") : null;
                if (linkUrlsObj instanceof Collection<?> col) {
                    LinkedHashSet<String> desired = new LinkedHashSet<>();
                    for (Object o : col) if (o != null) desired.add(String.valueOf(o));

                    LinkedHashSet<String> current = new LinkedHashSet<>();
                    for (Link l : linkRepository.listAll()) {
                        if (l.techWatches != null && l.techWatches.contains(tw)) current.add(l.url);
                    }

                    for (String url : desired) {
                        if (!current.contains(url)) {
                            Link l = linkRepository.find("url", url).firstResult();
                            if (l == null) {
                                l = new Link();
                                l.url = url;
                                l.title = url; // minimal title
                                linkRepository.persist(l);
                            }
                            if (l.techWatches == null) l.techWatches = new LinkedHashSet<>();
                            l.techWatches.add(tw);
                        }
                    }

                    for (String url : current) {
                        if (!desired.contains(url)) {
                            Link l = linkRepository.find("url", url).firstResult();
                            if (l != null && l.techWatches != null) {
                                l.techWatches.remove(tw);
                            }
                        }
                    }
                }
            }
            case "Tag" -> {
                String name = req.key();
                if (name == null) throw new BadRequestException("Missing key (name) for Tag");
                Tag t = tagRepository.find("name", name).firstResult();
                if (t == null) { t = new Tag(); t.name = name; tagRepository.persist(t); }
            }
            default -> throw new BadRequestException("Unsupported entity: " + req.entity());
        }
    }

    public void executeZip(InputStream in) {
        Map<String, byte[]> files = zipService.readZipToMap(in);

        // Tags
        List<TagExport> tags = zipService.readIfPresent(files, TAGS.fileName(), new TypeReference<>(){});
        Map<String, Tag> tagByName = new HashMap<>();
        if (tags != null) {
            for (TagExport t : tags) {
                Tag existing = tagRepository.find("name", t.name()).firstResult();
                if (existing == null) {
                    existing = new Tag();
                    existing.name = t.name();
                    tagRepository.persist(existing);
                }
                tagByName.put(existing.name, existing);
            }
        }

        // PromptInstruction
        List<PromptExport> prompts = zipService.readIfPresent(files, PROMPTS.fileName(), new TypeReference<>(){});
        if (prompts != null) {
            for (PromptExport p : prompts) {
                PromptInstruction pi = promptRepository.findById(p.type());
                if (pi == null) {
                    pi = new PromptInstruction();
                    pi.type = p.type();
                    pi.content = p.content();
                    promptRepository.persist(pi);
                } else {
                    pi.content = p.content();
                }
            }
        }

        // AiApiKey
        List<ApiKeyExport> apikeys = zipService.readIfPresent(files, API_KEYS.fileName(), new TypeReference<>(){});
        if (apikeys != null) {
            for (ApiKeyExport apiKey : apikeys) {
                AiApiKey existing = aiApiKeyRepository.find("provider = ?1 and name = ?2", apiKey.provider(), apiKey.name()).firstResult();
                boolean keyIsPresent = apiKey.apiKey() != null && !apiKey.apiKey().isBlank();
                if (existing == null) {
                    AiApiKey n = new AiApiKey();
                    n.provider = apiKey.provider();
                    n.name = apiKey.name();
                    n.baseUrl = apiKey.baseUrl();
                    if (keyIsPresent) {
                        n.apiKey = apiKey.apiKey();
                    }
                    n.organizationId = apiKey.organizationId();
                    n.projectId = apiKey.projectId();
                    aiApiKeyRepository.persist(n);
                } else {
                    existing.baseUrl = apiKey.baseUrl();
                    if (keyIsPresent) {
                        existing.apiKey = apiKey.apiKey();
                    }
                    existing.organizationId = apiKey.organizationId();
                    existing.projectId = apiKey.projectId();
                }
            }
        }

        // Links
        List<LinkExport> links = zipService.readIfPresent(files, LINKS.fileName(), new TypeReference<>(){});
        if (links != null) {
            for (LinkExport le : links) {
                Link link = linkRepository.find("url", le.url()).firstResult();
                if (link == null) {
                    link = new Link();
                    link.title = le.title();
                    link.url = le.url();
                    link.description = le.description();
                    link.summary = le.summary();
                    linkRepository.persist(link);
                } else {
                    link.title = le.title();
                    link.description = le.description();
                    link.summary = le.summary();
                }
                if (le.tags() != null) {
                    LinkedHashSet<Tag> newTags = new LinkedHashSet<>();
                    for (String tn : le.tags()) {
                        Tag t = tagByName.computeIfAbsent(tn, n -> {
                            Tag tt = new Tag();
                            tt.name = n;
                            tagRepository.persist(tt);
                            return tt;
                        });
                        newTags.add(t);
                    }
                    link.tags = newTags;
                }
            }
        }

        // TechWatches
        List<TechWatchExport> techwatches = zipService.readIfPresent(files, TECHWATCHES.fileName(), new TypeReference<>(){});
        if (techwatches != null) {
            for (TechWatchExport te : techwatches) {
                TechWatch tw = techWatchRepository.find("date", te.date()).firstResult();
                if (tw == null) {
                    tw = new TechWatch();
                    tw.date = te.date();
                    tw.status = safeStatus(te.status());
                    tw.maxArticles = te.maxArticles();
                    techWatchRepository.persist(tw);
                } else {
                    tw.status = safeStatus(te.status());
                    tw.maxArticles = te.maxArticles();
                }
                if (te.linkUrls() != null) {
                    for (String url : te.linkUrls()) {
                        Link link = linkRepository.find("url", url).firstResult();
                        if (link != null) {
                            link.techWatches.add(tw);
                        }
                    }
                }
            }
        }
    }

    private TechWatchStatus safeStatus(String incoming) {
        TechWatchStatus s = TechWatchStatus.valueOf(incoming);
        if (s == TechWatchStatus.ACTIVE) {
            return TechWatchStatus.PLANNED;
        }
        return s;
    }

    private String valueAsString(Map<String, Object> map, String key) {
        if (map == null) return null;
        Object v = map.get(key);
        return v == null ? null : String.valueOf(v);
    }

    private Integer valueAsInteger(Map<String, Object> map) {
        if (map == null) return null;
        Object v = map.get("maxArticles");
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        return Integer.parseInt(String.valueOf(v));
    }
}
