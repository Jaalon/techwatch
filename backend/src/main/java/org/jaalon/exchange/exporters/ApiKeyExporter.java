package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.ExportType;
import org.jaalon.apikey.AiApiKey;
import org.jaalon.apikey.AiApiKeyRepository;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.dto.ApiKeyExport;

import java.util.ArrayList;
import java.util.List;

import static org.jaalon.exchange.ExportType.TECHNICAL;

@ApplicationScoped
public class ApiKeyExporter implements DataExporter {
    @Inject AiApiKeyRepository aiApiKeyRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.API_KEYS; }

    @Override
    public Object exportData() {
        List<AiApiKey> keys = aiApiKeyRepository.listAll();
        List<ApiKeyExport> apiKeyListToExport = new ArrayList<>();
        for (AiApiKey apiKey : keys) {
            apiKeyListToExport.add(new ApiKeyExport(apiKey.provider, apiKey.name, apiKey.baseUrl, apiKey.apiKey, apiKey.organizationId, apiKey.projectId));
        }
        return apiKeyListToExport;
    }

    @Override
    public ExportType dataType() {
        return TECHNICAL;
    }
}
