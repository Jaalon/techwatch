package org.jaalon.config;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PromptInstructionRepository implements PanacheRepositoryBase<PromptInstruction, String> {
}
