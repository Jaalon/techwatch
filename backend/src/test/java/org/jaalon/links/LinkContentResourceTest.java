package org.jaalon.links;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LinkContentResourceTest {

    @jakarta.inject.Inject
    LinkRepository repo;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        repo.deleteAll();
    }

    @Test
    void contentIsOptionalAndCanBeSetAndRetrievedAsMarkdown() {
        // Create a link without content
        long id =
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"title\":\"Doc\",\"url\":\"https://example.com/doc\"}")
                .when()
                    .post("/api/links")
                .then()
                    .statusCode(201)
                    .body("content", nullValue())
                    .extract().jsonPath().getLong("id");

        // Set content as text/markdown using text/plain
        String md = "# Title\n\nSome **markdown** content.";
        given()
            .contentType("text/plain")
            .body(md)
        .when()
            .put("/api/links/" + id + "/content")
        .then()
            .statusCode(200)
            .body("id", equalTo((int) id))
            .body("content", equalTo(md));

        // Retrieve content via dedicated endpoint
        given()
        .when()
            .get("/api/links/" + id + "/content")
        .then()
            .statusCode(200)
            .contentType("text/plain")
            .body(equalTo(md));

        // Also available on the JSON resource
        given()
        .when()
            .get("/api/links/" + id)
        .then()
            .statusCode(200)
            .body("content", equalTo(md));
    }

    @Test
    void canStoreVeryLargeMarkdownContent() {
        // Create link
        long id =
                given()
                    .contentType(ContentType.JSON)
                    .body("{\"title\":\"Large\",\"url\":\"https://example.com/large\"}")
                .when()
                    .post("/api/links")
                .then()
                    .statusCode(201)
                    .extract().jsonPath().getLong("id");

        // Generate ~1MB of markdown content
        int size = 1_000_000;
        StringBuilder sb = new StringBuilder(size + 100);
        sb.append("# Big Doc\n\n");
        for (int i = 0; i < size; i++) {
            sb.append('A');
        }
        String big = sb.toString();

        // Upload as text/plain
        given()
            .contentType("text/plain")
            .body(big)
        .when()
            .put("/api/links/" + id + "/content")
        .then()
            .statusCode(200)
            .body("id", equalTo((int) id));

        // Fetch back and compare length (to avoid huge body diff in matcher)
        String fetched =
            given()
            .when()
                .get("/api/links/" + id + "/content")
            .then()
                .statusCode(200)
                .extract().asString();
        org.junit.jupiter.api.Assertions.assertEquals(big.length(), fetched.length(), "Content length should match for large payloads");
        // Spot check prefix/suffix
        org.junit.jupiter.api.Assertions.assertTrue(fetched.startsWith("# Big Doc"));
        org.junit.jupiter.api.Assertions.assertEquals('A', fetched.charAt(fetched.length()-1));
    }
}
