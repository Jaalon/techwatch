package org.jaalon.llm;

import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Simple HTTP-based client to fetch available models from a Perplexity-compatible endpoint.
 * This implementation can be overridden in tests by providing an @Alternative bean.
 */
@ApplicationScoped
public class PerplexityService {

    public List<String> listModels(String baseUrl, String apiKey) {
        if (baseUrl == null || baseUrl.isBlank()) throw new IllegalArgumentException("baseUrl is required");
        if (apiKey == null || apiKey.isBlank()) throw new IllegalArgumentException("apiKey is required");
        try {
            String url = baseUrl.endsWith("/") ? baseUrl + "models" : baseUrl + "/models";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                return parseModels(resp.body());
            }
            throw new RuntimeException("Failed to fetch models: HTTP " + resp.statusCode());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to fetch models: " + e.getMessage(), e);
        }
    }

    // Very small parser to extract model names from a few likely JSON shapes without adding deps
    // Supported shapes:
    // { "data": [{"id":"model-a"},{"id":"model-b"}] }
    // { "models": ["model-a","model-b"] }
    // { "data": ["model-a","model-b"] }
    protected List<String> parseModels(String json) {
        List<String> out = new ArrayList<>();
        if (json == null || json.isBlank()) return out;
        String s = json.replaceAll("\\s+", "");
        // Try array of objects under data with id
        int dataIdx = s.indexOf("\"data\":");
        if (dataIdx >= 0) {
            int arrStart = s.indexOf('[', dataIdx);
            int arrEnd = s.indexOf(']', arrStart);
            if (arrStart > 0 && arrEnd > arrStart) {
                String arr = s.substring(arrStart + 1, arrEnd);
                String[] items = arr.split("\\},\\{");
                for (String it : items) {
                    int idIdx = it.indexOf("\"id\":\"");
                    if (idIdx >= 0) {
                        int start = idIdx + 6;
                        int end = it.indexOf('"', start);
                        if (end > start) out.add(it.substring(start, end));
                    } else if (it.startsWith("\"")) { // data: ["model-a","model-b"] variant
                        int start = it.indexOf('"') + 1;
                        int end = it.indexOf('"', start);
                        if (start >= 0 && end > start) out.add(it.substring(start, end));
                    }
                }
                return out;
            }
        }
        // Try models: ["a","b"]
        int modelsIdx = s.indexOf("\"models\":");
        if (modelsIdx >= 0) {
            int arrStart = s.indexOf('[', modelsIdx);
            int arrEnd = s.indexOf(']', arrStart);
            if (arrStart > 0 && arrEnd > arrStart) {
                String arr = s.substring(arrStart + 1, arrEnd);
                for (String it : arr.split(",")) {
                    String v = it.replace("\"", "");
                    if (!v.isBlank()) out.add(v);
                }
            }
        }
        return out;
    }
}
