package org.jaalon.links;

import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jaalon.apikey.AiApiKey;
import org.jaalon.apikey.AiApiKeyRepository;
import org.jaalon.promptinstruction.PromptInstruction;
import org.jaalon.promptinstruction.PromptInstructionRepository;
import org.jaalon.llm.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
public class LinkSummarizeResourceTest {

    @Inject
    LinkRepository linkRepository;

    @Inject
    LlmConfigRepository llmConfigRepository;

    @Inject
    AiApiKeyRepository aiApiKeyRepository;

    @Inject
    PromptInstructionRepository instructionRepository;

    @InjectMock
    LlmClient llmClient;

    @BeforeEach
    @Transactional
    void setup() {
        // Clean
        linkRepository.deleteAll();
        llmConfigRepository.deleteAll();
        instructionRepository.deleteAll();
        aiApiKeyRepository.deleteAll();
        // Create an API key and default LLM config
        AiApiKey key = new AiApiKey();
        key.provider = "perplexity";
        key.name = "Local";
        key.baseUrl = "http://localhost:9999";
        key.apiKey = "key";
        aiApiKeyRepository.persist(key);

        LlmConfig cfg = new LlmConfig();
        cfg.name = "test";
        cfg.aiApiKey = key;
        cfg.model = "model-x";
        cfg.isDefault = true;
        llmConfigRepository.persist(cfg);
        // Insert summarize instruction
        PromptInstruction pi = new PromptInstruction();
        pi.type = "summarize";
        pi.content = "Résume cet article de façon succincte en Français en suivant les directives suivantes :\n- Les idées importantes\n- Les points à retenir";
        instructionRepository.persist(pi);
    }

    @Test
    void summarizeEndpoint_shouldSaveAndReturnSummary() {
        // Mock LLM
        Mockito.when(llmClient.generate(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn("- Idée 1\n- Idée 2\nPoints clés: A, B");

        // Create a link
        long id =
            given().contentType(ContentType.JSON)
                .body("{\"title\":\"T\",\"url\":\"https://example.com/article\"}")
            .when().post("/api/links")
            .then().statusCode(201)
            .extract().jsonPath().getLong("id");

        // Upsert content for the link (required now)
        given().contentType(ContentType.TEXT)
            .body("# T\n\nContenu de test pour résumé.")
        .when()
            .put("/api/links/" + id + "/content")
        .then()
            .statusCode(200);

        // Call summarize
        given()
        .when()
            .post("/api/links/" + id + "/summarize")
        .then()
            .statusCode(200)
            .body("summary", equalTo("- Idée 1\n- Idée 2\nPoints clés: A, B"));
    }
}
