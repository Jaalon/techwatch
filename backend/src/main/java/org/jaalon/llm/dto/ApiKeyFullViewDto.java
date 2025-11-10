package org.jaalon.llm.dto;

import org.jaalon.apikey.AiApiKey;

public class ApiKeyFullViewDto {
    public Long id;
    public String provider;
    public String name;
    public String baseUrl;
    public String apiKey; // full secret, returned only by GET /{id}
    public String organizationId;
    public String projectId;

    public static ApiKeyFullViewDto from(AiApiKey aiApiKey) {
        ApiKeyFullViewDto apiKeyFullViewDto = new ApiKeyFullViewDto();
        apiKeyFullViewDto.id = aiApiKey.id;
        apiKeyFullViewDto.provider = aiApiKey.provider;
        apiKeyFullViewDto.name = aiApiKey.name;
        apiKeyFullViewDto.baseUrl = aiApiKey.baseUrl;
        apiKeyFullViewDto.apiKey = aiApiKey.apiKey;
        apiKeyFullViewDto.organizationId = aiApiKey.organizationId;
        apiKeyFullViewDto.projectId = aiApiKey.projectId;
        return apiKeyFullViewDto;
    }
}
