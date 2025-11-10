package org.jaalon.llm.dto;

import org.jaalon.llm.LlmConfig;

public class llmConfigViewDto {
    public Long id;
    public String name;
    public Long aiApiKeyId;
    public String model;
    public boolean isDefault;

    public static llmConfigViewDto from(LlmConfig c) {
        llmConfigViewDto v = new llmConfigViewDto();
        v.id = c.id;
        v.name = c.name;
        v.aiApiKeyId = (c.aiApiKey != null ? c.aiApiKey.id : null);
        v.model = c.model;
        v.isDefault = c.isDefault;
        return v;
    }
}
