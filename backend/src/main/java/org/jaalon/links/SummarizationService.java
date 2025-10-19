package org.jaalon.links;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jaalon.config.PromptInstruction;
import org.jaalon.config.PromptInstructionRepository;
import org.jaalon.llm.LlmClient;
import org.jaalon.llm.LlmConfig;
import org.jaalon.llm.LlmConfigRepository;

import java.util.Optional;

@ApplicationScoped
public class SummarizationService {

    public static final String TYPE_SUMMARIZE = "summarize";

    @Inject
    LlmConfigRepository llmConfigRepository;

    @Inject
    PromptInstructionRepository instructionRepository;

    @Inject
    LlmClient llmClient;

    public String summarize(String content) {
        Log.info("Starting summarization from stored content. Length=" + (content == null ? 0 : content.length()));

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content is required");
        }
        // Find default LLM config
        Optional<LlmConfig> cfgOpt = llmConfigRepository.find("isDefault = true").firstResultOptional();
        LlmConfig cfg = cfgOpt.orElseThrow(() -> new IllegalStateException("No default LLM configuration found"));
        // Load summarize instruction
        PromptInstruction pi = instructionRepository.findById(TYPE_SUMMARIZE);
        if (pi == null || pi.content == null || pi.content.isBlank()) {
            throw new IllegalStateException("Summarize instruction not found");
        }
        Log.info("Loaded instruction: " + pi.content );

        String prompt = pi.content.trim() + "\n\n" + content.trim();

        Log.info("Prompt built with content length: " + content.length());

        String out = llmClient.generate(cfg.baseUrl, cfg.apiKey, cfg.model, prompt);

        Log.info("LLM out: " + out );

        if (out == null || out.isBlank()) {
            throw new IllegalStateException("Empty response from LLM");
        }
        // Ensure human readable text (normalize line endings and trim)
        return out.replaceAll("\r\n?", "\n").trim();
    }
}
