package org.jaalon.exchange.exporters;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.PromptExport;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;
import org.jaalon.promptinstruction.PromptInstruction;
import org.jaalon.promptinstruction.PromptInstructionRepository;

import java.util.ArrayList;
import java.util.List;

import static org.jaalon.exchange.ExportType.TECHNICAL;

@ApplicationScoped
public class PromptExporter implements DataExporter {
    @Inject PromptInstructionRepository promptRepository;

    @Override
    public DataExchangeFiles file() { return DataExchangeFiles.PROMPTS; }

    @Override
    public Object exportData() {
        List<PromptExport> out = new ArrayList<>();
        for (PromptInstruction pi : promptRepository.listAll()) {
            out.add(new PromptExport(pi.type, pi.content));
        }
        return out;
    }

    @Override
    public ExportType dataType() {
        return TECHNICAL;
    }
}
