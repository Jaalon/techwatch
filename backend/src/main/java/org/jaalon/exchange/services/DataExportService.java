package org.jaalon.exchange.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.enterprise.inject.Instance;
import jakarta.ws.rs.BadRequestException;
import org.jaalon.exchange.ExportType;
import org.jaalon.exchange.dto.*;
import org.jaalon.exchange.exporters.DataExporter;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.zip.ZipOutputStream;

import static org.jaalon.exchange.DataExchangeFiles.*;

@ApplicationScoped
public class DataExportService {

    @Inject
    ZipService zipService;
    @Inject Instance<DataExporter> exporters;

    public byte[] buildExportZip(ExportType exportType) {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(byteArrayOutputStream)) {
            for (DataExporter exporter : exporters) {
                if (exporter.dataType() == exportType) {
                    zipService.writeJsonEntry(zos, exporter.file().fileName(), exporter.exportData());
                }
            }
            zos.finish();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create ZIP", e);
        }
        return byteArrayOutputStream.toByteArray();
    }

    public byte[] exportSelectedItemsZip(List<ResolveRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("No items to export");
        }

        List<ApiKeyExport> ak = new ArrayList<>();
        List<PromptExport> prompts = new ArrayList<>();
        List<TagExport> tags = new ArrayList<>();
        List<LinkExport> links = new ArrayList<>();
        List<TechWatchExport> techs = new ArrayList<>();

        for (ResolveRequest it : items) {
            switch (it.entity()) {
                case "PromptInstruction" -> {
                    String type = it.key();
                    String content = valueAsString(it.data(), "content");
                    prompts.add(new PromptExport(type, content));
                }
                case "AiApiKey" -> {
                    String[] parts = it.key() != null ? it.key().split(":", 2) : null;
                    if (parts == null || parts.length != 2)
                        throw new BadRequestException("AiApiKey key must be 'provider:name'");
                    ak.add(new ApiKeyExport(
                            parts[0],
                            parts[1],
                            valueAsString(it.data(), "baseUrl"),
                            valueAsString(it.data(), "apiKey"),
                            valueAsString(it.data(), "organizationId"),
                            valueAsString(it.data(), "projectId")
                    ));
                }
                case "Tag" -> tags.add(new TagExport(it.key()));
                case "Link" -> {
                    String title = valueAsString(it.data(), "title");
                    String desc = valueAsString(it.data(), "description");
                    String sum = valueAsString(it.data(), "summary");
                    Set<String> t = new LinkedHashSet<>();
                    Object to = it.data() != null ? it.data().get("tags") : null;
                    if (to instanceof Collection<?> col) for (Object o : col) if (o != null) t.add(String.valueOf(o));
                    links.add(new LinkExport(title, it.key(), desc, sum, t));
                }
                case "TechWatch" -> {
                    LocalDate d = LocalDate.parse(it.key());
                    String status = valueAsString(it.data(), "status");
                    Integer max = valueAsInteger(it.data());
                    Set<String> urls = new LinkedHashSet<>();
                    Object uo = it.data() != null ? it.data().get("linkUrls") : null;
                    if (uo instanceof Collection<?> col) for (Object o : col) if (o != null) urls.add(String.valueOf(o));
                    techs.add(new TechWatchExport(d, status, max, urls));
                }
                default -> throw new BadRequestException("Unsupported entity: " + it.entity());
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            if (!prompts.isEmpty()) zipService.writeJsonEntry(zos, PROMPTS.fileName(), prompts);
            if (!ak.isEmpty()) zipService.writeJsonEntry(zos, API_KEYS.fileName(), ak);
            if (!tags.isEmpty()) zipService.writeJsonEntry(zos, TAGS.fileName(), tags);
            if (!links.isEmpty()) zipService.writeJsonEntry(zos, LINKS.fileName(), links);
            if (!techs.isEmpty()) zipService.writeJsonEntry(zos, TECHWATCHES.fileName(), techs);
            zos.finish();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create ZIP", e);
        }
        return baos.toByteArray();
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
