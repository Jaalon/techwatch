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

    public String summarize(String articleUrl) {
        Log.info("Starting summarization for URL:" + articleUrl);

        if (articleUrl == null || articleUrl.isBlank()) {
            throw new IllegalArgumentException("articleUrl is required");
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

        String prompt = pi.content.trim() + "\n\n" + articleUrl.trim();

        Log.info("Prompt: " + prompt );

        String out = llmClient.generate(cfg.baseUrl, cfg.apiKey, cfg.model, prompt);

        Log.info("LLM out: " + out );

        if (out == null || out.isBlank()) {
            throw new IllegalStateException("Empty response from LLM");
        }
        // Ensure human readable text (normalize line endings and trim)
        return out.replaceAll("\r\n?", "\n").trim();
    }
}
