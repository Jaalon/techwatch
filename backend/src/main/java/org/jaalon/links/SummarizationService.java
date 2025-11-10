package org.jaalon.links;

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
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content is required");
        }

        Optional<LlmConfig> optionalLlmConfig = llmConfigRepository.find("isDefault = true").firstResultOptional();
        LlmConfig llmConfig = optionalLlmConfig.orElseThrow(() -> new IllegalStateException("No default LLM configuration found"));

        PromptInstruction promptInstruction = instructionRepository.findById(TYPE_SUMMARIZE);

        if (promptInstruction == null || promptInstruction.content == null || promptInstruction.content.isBlank()) {
            throw new IllegalStateException("Summarize instruction not found");
        }

        String prompt = promptInstruction.content.trim() + "\n\n" + content.trim();

        if (llmConfig.aiApiKey == null) {
            throw new IllegalStateException("LLM configuration has no associated API key");
        }

        String summarizationResult = llmClient.generate(llmConfig.aiApiKey.baseUrl, llmConfig.aiApiKey.apiKey, llmConfig.model, prompt);

        if (summarizationResult == null || summarizationResult.isBlank()) {
            throw new IllegalStateException("Empty response from LLM");
        }

        return summarizationResult.replaceAll("\r\n?", "\n").trim();
    }
}
