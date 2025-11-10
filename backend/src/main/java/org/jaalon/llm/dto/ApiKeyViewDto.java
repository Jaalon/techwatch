package org.jaalon.llm.dto;

import org.jaalon.apikey.AiApiKey;

public class ApiKeyViewDto {
    public Long id;
    public String provider;
    public String name;
    public String baseUrl;
    public String organizationId;
    public String projectId;
    public String keyPreview;

    public static ApiKeyViewDto from(AiApiKey aiApiKey) {
        ApiKeyViewDto viewDto = new ApiKeyViewDto();
        viewDto.id = aiApiKey.id;
        viewDto.provider = aiApiKey.provider;
        viewDto.name = aiApiKey.name;
        viewDto.baseUrl = aiApiKey.baseUrl;
        viewDto.organizationId = aiApiKey.organizationId;
        viewDto.projectId = aiApiKey.projectId;
        String apiKey = aiApiKey.apiKey;

        if (apiKey == null || apiKey.isBlank()) {
            viewDto.keyPreview = null;
        } else if (apiKey.length() <= 6) {
            viewDto.keyPreview = "***";
        } else {
            viewDto.keyPreview = apiKey.substring(0, 3) + "…" + apiKey.substring(apiKey.length() - 2);
        }
        return viewDto;
    }
}
