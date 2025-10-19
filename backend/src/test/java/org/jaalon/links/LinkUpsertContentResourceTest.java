package org.jaalon.links;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LinkUpsertContentResourceTest {

    @jakarta.inject.Inject
    LinkRepository repo;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        repo.deleteAll();
    }

    @Test
    void createNewLinkWithContent() {
        String body = "{\n" +
                "  \"url\": \"https://example.com/article\",\n" +
                "  \"title\": \"An Article\",\n" +
                "  \"content\": \"# Hello\\nWorld\",\n" +
                "  \"lastModified\": \"2025-01-01T00:00:00Z\"\n" +
                "}";

        given()
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post("/api/links/upsert-content")
        .then()
            .statusCode(anyOf(is(200), is(201)))
            .body("url", equalTo("https://example.com/article"))
            .body("content", equalTo("# Hello\nWorld"));
    }

    @Test
    void doNotUpdateWhenIncomingIsOlderOrEqual() {
        // First insert newer content
        String newer = "{\n" +
                "  \"url\": \"https://example.com/article2\",\n" +
                "  \"title\": \"An Article 2\",\n" +
                "  \"content\": \"A\",\n" +
                "  \"lastModified\": \"2025-10-19T00:00:00Z\"\n" +
                "}";
        given().contentType(ContentType.JSON).body(newer)
            .when().post("/api/links/upsert-content")
            .then().statusCode(anyOf(is(200), is(201)));

        // Try update with older lastModified, content should remain 'A'
        String older = "{\n" +
                "  \"url\": \"https://example.com/article2\",\n" +
                "  \"content\": \"B\",\n" +
                "  \"lastModified\": \"2024-10-19T00:00:00Z\"\n" +
                "}";
        given().contentType(ContentType.JSON).body(older)
            .when().post("/api/links/upsert-content")
            .then().statusCode(200)
            .body("content", equalTo("A"));
    }

    @Test
    void updateWhenIncomingIsNewer() throws Exception {
        // First insert older content
        String older = "{\n" +
                "  \"url\": \"https://example.com/article3\",\n" +
                "  \"title\": \"An Article 3\",\n" +
                "  \"content\": \"First\",\n" +
                "  \"lastModified\": \"2024-10-19T00:00:00Z\"\n" +
                "}";
        given().contentType(ContentType.JSON).body(older)
            .when().post("/api/links/upsert-content")
            .then().statusCode(anyOf(is(200), is(201)));

        // Now update with newer lastModified
        String newer = "{\n" +
                "  \"url\": \"https://example.com/article3\",\n" +
                "  \"content\": \"Second\",\n" +
                "  \"lastModified\": \"2026-10-19T00:00:00Z\"\n" +
                "}";
        given().contentType(ContentType.JSON).body(newer)
            .when().post("/api/links/upsert-content")
            .then().statusCode(200)
            .body("content", equalTo("Second"));
    }

    @Test
    void nonTextualSkipsContentButCreatesLink() {
        String body = "{\n" +
                "  \"url\": \"https://youtube.com/watch?v=abc\",\n" +
                "  \"title\": \"Video\",\n" +
                "  \"nonTextual\": true\n" +
                "}";

        given()
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post("/api/links/upsert-content")
        .then()
            .statusCode(anyOf(is(200), is(201)))
            .body("url", equalTo("https://youtube.com/watch?v=abc"))
            .body("content", anyOf(nullValue(), equalTo("")));
    }
}
