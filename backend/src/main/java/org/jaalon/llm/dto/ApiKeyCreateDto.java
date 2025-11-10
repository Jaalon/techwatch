package org.jaalon.llm.dto;

public class ApiKeyCreateDto {
    public String provider; // required in {perplexity, openai, mistral}
    public String name;     // required
    public String baseUrl;  // required
    public String apiKey;   // required
    public String organizationId; // optional (openai)
    public String projectId;      // optional (openai)
}
