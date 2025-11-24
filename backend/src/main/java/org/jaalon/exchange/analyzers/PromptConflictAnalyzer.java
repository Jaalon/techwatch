package org.jaalon.exchange.analyzers;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.exchange.dto.PromptExport;
import org.jaalon.promptinstruction.PromptInstruction;
import org.jaalon.promptinstruction.PromptInstructionRepository;
import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.services.ZipService;
import org.jaalon.exchange.dto.ConflictItem;

import java.util.*;

@ApplicationScoped
public class PromptConflictAnalyzer implements ConflictAnalyzer {
    @Inject ZipService zipService;
    @Inject PromptInstructionRepository promptRepository;

    @Override
    public List<ConflictItem> analyze(Map<String, byte[]> files) {
        List<ConflictItem> conflicts = new ArrayList<>();
        List<PromptExport> prompts = zipService.readIfPresent(files, DataExchangeFiles.PROMPTS.fileName(), new TypeReference<>(){});
        if (prompts != null) {
            for (PromptExport p : prompts) {
                PromptInstruction existing = promptRepository.findById(p.type());
                Map<String, Object> existingPayload = existing == null ? null : Map.of(
                        "type", p.type(),
                        "content", existing.content
                );
                Map<String, Object> incomingPayload = Map.of(
                        "type", p.type(),
                        "content", p.content()
                );
                conflicts.add(new ConflictItem("PromptInstruction", p.type(), existingPayload, incomingPayload));
            }
        }
        return conflicts;
    }
}
