package org.jaalon.llm;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiChatRequestParameters;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenAI-compatible client using LangChain4j to generate text completions.
 * Supports Perplexity, OpenAI, and any OpenAI-compatible API.
 */
@ApplicationScoped
public class LlmClient {

    // Cache pour réutiliser les modèles
    private final Map<String, OpenAiChatModel> modelCache = new ConcurrentHashMap<>();

    /**
     * Generate text from a simple prompt
     */
    public String generate(String baseUrl, String apiKey, String model, String prompt) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalArgumentException("baseUrl is required");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("apiKey is required");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalArgumentException("model is required");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("prompt is required");
        }

        Log.infof("Calling LLM - Model: %s, Base URL: %s", model, baseUrl);

        try {
            // Récupérer ou créer le modèle
            OpenAiChatModel chatModel = getOrCreateModel(baseUrl, apiKey, model);
            
            // Créer la liste de messages
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(UserMessage.from(prompt));

            OpenAiChatRequestParameters parameters = OpenAiChatRequestParameters.builder()
                    .modelName(model)
                    .build();

            ChatRequest chatRequest = ChatRequest.builder()
                .messages(messages)
                .parameters(parameters)
                .build();
            
            // ✅ Appeler doChat()
            ChatResponse response = chatModel.doChat(chatRequest);
            
            // Vérifier la réponse
            if (response == null || response.aiMessage() == null) {
                Log.error("Empty response from LLM");
                throw new IllegalStateException("Empty response from LLM");
            }
            
            AiMessage aiMessage = response.aiMessage();
            String text = aiMessage.text();
            
            if (text == null || text.isBlank()) {
                Log.error("LLM returned empty text");
                throw new IllegalStateException("LLM returned empty text");
            }
            
            // Log des informations de tokens si disponibles
            if (Log.isDebugEnabled() && response.metadata() != null) {
                var metadata = response.metadata();
                if (metadata.tokenUsage() != null) {
                    Log.debugf("LLM response - Length: %d chars, Tokens: input=%d, output=%d, total=%d",
                        text.length(),
                        metadata.tokenUsage().inputTokenCount(),
                        metadata.tokenUsage().outputTokenCount(),
                        metadata.tokenUsage().totalTokenCount());
                }
            }
            
            return normalize(text);
            
        } catch (Exception e) {
            Log.errorf(e, "LLM call failed for model: %s at %s", model, baseUrl);
            throw new RuntimeException("LLM call failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get or create a cached OpenAiChatModel
     */
    private OpenAiChatModel getOrCreateModel(String baseUrl, String apiKey, String model) {
        String cacheKey = buildCacheKey(baseUrl, model);
        
        return modelCache.computeIfAbsent(cacheKey, key -> {
            Log.infof("Creating new ChatLanguageModel for: %s @ %s", model, baseUrl);
            
            return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .modelName(model)
                .timeout(Duration.ofSeconds(60))
                .temperature(0.7)
                .maxRetries(3)
                .logRequests(Log.isDebugEnabled())
                .logResponses(Log.isDebugEnabled())
                .build();
        });
    }

    /**
     * Invalidate cache for a specific configuration
     */
    public void invalidateCache(String baseUrl, String model) {
        String cacheKey = buildCacheKey(baseUrl, model);
        modelCache.remove(cacheKey);
        Log.infof("Cache invalidated for: %s @ %s", model, baseUrl);
    }

    /**
     * Clear all cached models
     */
    public void clearCache() {
        modelCache.clear();
        Log.info("All LLM model cache cleared");
    }

    private String buildCacheKey(String baseUrl, String model) {
        return baseUrl + "|" + model;
    }

    private String normalize(String s) {
        return s.replace("\r\n", "\n").replace('\r', '\n').trim();
    }
}
