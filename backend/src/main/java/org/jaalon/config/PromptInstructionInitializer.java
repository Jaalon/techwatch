package org.jaalon.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class PromptInstructionInitializer {

    public static final String TYPE_SUMMARIZE = "summarize";
    private static final String DEFAULT_TEXT = "Résume cet article de façon succincte en Français en suivant les directives suivantes :\n- Les idées importantes\n- Les points à retenir";

    @Inject
    PromptInstructionRepository repository;

    @Transactional
    void onStart(@Observes StartupEvent ev) {
        PromptInstruction existing = repository.findById(TYPE_SUMMARIZE);
        if (existing == null || existing.content == null || existing.content.isBlank()) {
            if (existing == null) {
                existing = new PromptInstruction();
                existing.type = TYPE_SUMMARIZE;
            }
            existing.content = DEFAULT_TEXT;
            if (!repository.isPersistent(existing)) {
                repository.persist(existing);
            }
        }
    }
}
