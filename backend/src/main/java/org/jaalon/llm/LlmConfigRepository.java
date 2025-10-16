package org.jaalon.llm;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class LlmConfigRepository implements PanacheRepository<LlmConfig> {
}
