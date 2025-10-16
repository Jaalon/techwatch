package org.jaalon.config;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class PromptInstructionInitializerTest {

    @Inject
    PromptInstructionRepository repo;

    @Inject
    PromptInstructionInitializer initializer;

    @BeforeEach
    @Transactional
    void clean() {
        repo.deleteAll();
    }

    @Test
    void seedsDefaultWhenMissing() {
        // No record
        assertNull(repo.findById("summarize"));
        // Simulate startup
        initializer.onStart(null);
        PromptInstruction pi = repo.findById("summarize");
        assertNotNull(pi);
        assertNotNull(pi.content);
        assertTrue(pi.content.contains("Les idées importantes"));
    }

    @Test
    @Transactional
    void fillsDefaultWhenBlank() {
        // Persist blank content
        PromptInstruction pi = new PromptInstruction();
        pi.type = "summarize";
        pi.content = "   ";
        repo.persist(pi);
        // Simulate startup
        initializer.onStart(null);
        PromptInstruction after = repo.findById("summarize");
        assertNotNull(after);
        assertNotNull(after.content);
        assertFalse(after.content.isBlank());
        assertTrue(after.content.contains("Les idées importantes"));
    }

    @Test
    @Transactional
    void keepsExistingNonBlankContent() {
        // Persist custom content
        PromptInstruction pi = new PromptInstruction();
        pi.type = "summarize";
        pi.content = "Custom content";
        repo.persist(pi);
        // Simulate startup
        initializer.onStart(null);
        PromptInstruction after = repo.findById("summarize");
        assertEquals("Custom content", after.content);
    }
}
