package org.jaalon.llm;

import jakarta.annotation.Priority;
import jakarta.enterprise.inject.Alternative;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@Alternative
@Priority(1)
@ApplicationScoped
public class TestPerplexityService extends PerplexityService {
    @Override
    public List<String> listModels(String baseUrl, String apiKey) {
        return List.of("pplx-70b", "pplx-8x7b", "pplx-llama-3.1-8b-instruct");
    }
}
