package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.LlmConfigExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;
import org.jaalon.llm.LlmConfig;
import org.jaalon.llm.LlmConfigRepository;

import java.util.ArrayList;
import java.util.List;

import static org.jaalon.exchange.ExportType.TECHNICAL;

@ApplicationScoped
public class LlmConfigExporter implements DataExporter {
    @Inject LlmConfigRepository llmConfigRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.LLM_CONFIGS; }

    @Override
    public Object exportData() {
        List<LlmConfig> list = llmConfigRepository.listAll();
        List<LlmConfigExport> out = new ArrayList<>();
        for (LlmConfig c : list) {
            String provider = c.aiApiKey == null ? null : c.aiApiKey.provider;
            String apiKeyName = c.aiApiKey == null ? null : c.aiApiKey.name;
            out.add(new LlmConfigExport(c.name, provider, apiKeyName, c.model, c.isDefault));
        }
        return out;
    }

    @Override
    public ExportType dataType() {
        return TECHNICAL;
    }
}
