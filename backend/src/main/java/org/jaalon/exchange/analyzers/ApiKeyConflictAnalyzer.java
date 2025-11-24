package org.jaalon.exchange.analyzers;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.ConflictItem;
import org.jaalon.exchange.dto.ApiKeyExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.services.ZipService;
import org.jaalon.apikey.AiApiKey;
import org.jaalon.apikey.AiApiKeyRepository;

import java.util.*;

@ApplicationScoped
public class ApiKeyConflictAnalyzer implements ConflictAnalyzer {
    @Inject ZipService zipService;
    @Inject AiApiKeyRepository aiApiKeyRepository;

    @Override
    public List<ConflictItem> analyze(Map<String, byte[]> files) {
        List<ConflictItem> conflicts = new ArrayList<>();
        List<ApiKeyExport> exportedApiKeyList = zipService.readIfPresent(files, DataExchangeFiles.API_KEYS.fileName(), new TypeReference<>(){});
        if (exportedApiKeyList != null) {
            for (ApiKeyExport exportedApiKey : exportedApiKeyList) {
                AiApiKey existing = aiApiKeyRepository.find("provider = ?1 and name = ?2", exportedApiKey.provider(), exportedApiKey.name()).firstResult();
                if (existing != null) {
                    Map<String, Object> ex = new LinkedHashMap<>();
                    ex.put("provider", existing.provider);
                    ex.put("name", existing.name);
                    ex.put("baseUrl", existing.baseUrl);
                    ex.put("organizationId", existing.organizationId);
                    ex.put("projectId", existing.projectId);
                    Map<String, Object> incomingMap = new LinkedHashMap<>();
                    incomingMap.put("provider", exportedApiKey.provider());
                    incomingMap.put("name", exportedApiKey.name());
                    incomingMap.put("baseUrl", exportedApiKey.baseUrl());
                    incomingMap.put("organizationId", exportedApiKey.organizationId());
                    incomingMap.put("projectId", exportedApiKey.projectId());
                    if (!Objects.equals(ex, incomingMap)) {
                        conflicts.add(new ConflictItem("AiApiKey", exportedApiKey.provider()+":"+exportedApiKey.name(), ex, incomingMap));
                    }
                }
            }
        }
        return conflicts;
    }
}
