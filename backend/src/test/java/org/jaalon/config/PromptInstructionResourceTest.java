package org.jaalon.config;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class PromptInstructionResourceTest {

    @Inject
    PromptInstructionRepository repo;

    @Inject
    PromptInstructionInitializer initializer;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        repo.deleteAll();
        // Re-seed default as initializer would on app startup
        initializer.onStart(null);
    }

    @Test
    void getReturnsDefaultSeededContent_thenPutUpdatesIt() {
        // GET should succeed with seeded default
        given()
        .when()
                .get("/api/instructions/summarize")
        .then()
                .statusCode(200)
                .body("type", equalTo("summarize"))
                .body("content", allOf(containsString("Résume cet article"), containsString("Les idées importantes")));

        // Update content
        String newContent = "Nouvelle instruction de résumé";
        given().contentType(ContentType.JSON)
                .body("{\"content\":\"" + newContent + "\"}")
        .when()
                .put("/api/instructions/summarize")
        .then()
                .statusCode(200)
                .body("type", equalTo("summarize"))
                .body("content", equalTo(newContent));

        // GET returns updated content
        given()
        .when()
                .get("/api/instructions/summarize")
        .then()
                .statusCode(200)
                .body("content", equalTo(newContent));
    }

    @Test
    void putWithMissingContent_returns400() {
        // Missing body or null content
        given().contentType(ContentType.JSON)
                .body("{}")
        .when()
                .put("/api/instructions/summarize")
        .then()
                .statusCode(400);
    }
}
