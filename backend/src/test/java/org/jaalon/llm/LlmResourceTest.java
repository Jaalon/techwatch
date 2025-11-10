package org.jaalon.llm;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.jaalon.apikey.AiApiKeyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LlmResourceTest {

    @Inject
    LlmConfigRepository repo;

    @Inject
    AiApiKeyRepository keyRepo;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        repo.deleteAll();
        keyRepo.deleteAll();
    }

    @Test
    void modelsAreFetchedViaBackend_withMockedPerplexity() {
        // Create a temporary API key to resolve credentials server-side
        long keyId = given().contentType(ContentType.JSON)
                .body("{\"provider\":\"perplexity\",\"name\":\"Tmp\",\"baseUrl\":\"https://api.perplexity.ai\",\"apiKey\":\"secret\"}")
            .when().post("/api/ai-keys")
            .then().statusCode(201)
            .extract().jsonPath().getLong("id");

        given()
                .queryParam("aiApiKeyId", keyId)
        .when()
                .get("/api/llm/models")
        .then()
                .statusCode(200)
                .body("models", notNullValue())
                .body("models.size()", greaterThan(0))
                .body("models", hasItems("pplx-70b", "pplx-8x7b"));
    }

    @Test
    void createConfig_requiresModel_andFirstBecomesDefault_thenSwitchDefault() {
        // Prepare a key
        long keyId = given().contentType(ContentType.JSON)
                .body("{\"provider\":\"perplexity\",\"name\":\"Key\",\"baseUrl\":\"https://api.perplexity.ai\",\"apiKey\":\"k\"}")
            .when().post("/api/ai-keys")
            .then().statusCode(201)
            .extract().jsonPath().getLong("id");

        // Missing model -> 400
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "Cfg A", "aiApiKeyId", keyId))
        .when()
                .post("/api/llm/configs")
        .then()
                .statusCode(400);

        // Create first
        long id1 = given().contentType(ContentType.JSON)
                .body(Map.of("name", "Cfg A", "aiApiKeyId", keyId, "model", "pplx-70b"))
        .when()
                .post("/api/llm/configs")
        .then()
                .statusCode(201)
                .body("isDefault", equalTo(true))
                .extract().jsonPath().getLong("id");

        // Create second -> not default
        long id2 = given().contentType(ContentType.JSON)
                .body(Map.of("name", "Cfg B", "aiApiKeyId", keyId, "model", "pplx-8x7b"))
        .when()
                .post("/api/llm/configs")
        .then()
                .statusCode(201)
                .body("isDefault", equalTo(false))
                .extract().jsonPath().getLong("id");

        // List -> 2 items, first default
        given().when().get("/api/llm/configs")
                .then().statusCode(200)
                .body("size()", equalTo(2))
                .body("find { it.id == " + id1 + " }.isDefault", equalTo(true))
                .body("find { it.id == " + id2 + " }.isDefault", equalTo(false));

        // Switch default to second
        given().when().put("/api/llm/configs/" + id2 + "/default")
                .then().statusCode(200)
                .body("id", equalTo((int) id2))
                .body("isDefault", equalTo(true));

        // Verify only one default
        given().when().get("/api/llm/configs")
                .then().statusCode(200)
                .body("findAll { it.isDefault }.size()", equalTo(1))
                .body("find { it.id == " + id1 + " }.isDefault", equalTo(false))
                .body("find { it.id == " + id2 + " }.isDefault", equalTo(true));
    }
}
