package org.jaalon.exchange;

public enum DataExchangeFiles {
    API_KEYS("api-keys.json"),
    LLM_CONFIGS("llm-configs.json"),
    PROMPTS("prompts.json"),
    LINKS("links.json"),
    TECHWATCHES("techwatches.json"),
    TAGS("tags.json");

    private final String fileName;

    DataExchangeFiles(String fileName) {
        this.fileName = fileName;
    }

    public String fileName() {
        return fileName;
    }

    @Override
    public String toString() {
        return fileName;
    }
}
