package org.jaalon.links;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LinkResourceTest {

    @jakarta.inject.Inject
    LinkRepository repo;

    @org.junit.jupiter.api.BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        repo.deleteAll();
    }

    @Test
    void fullCrudFlow() {
        // Create
        String body = "{" +
                "\"title\":\"Title 1\"," +
                "\"url\":\"https://example.com/a\"," +
                "\"description\":\"Desc\"}";

        long id =
                given()
                        .contentType(ContentType.JSON)
                        .body(body)
                .when()
                        .post("/api/links")
                .then()
                        .statusCode(201)
                        .body("title", equalTo("Title 1"))
                        .body("status", equalTo("TO_PROCESS"))
                        .extract().jsonPath().getLong("id");

        // Get
        given()
        .when()
                .get("/api/links/" + id)
        .then()
                .statusCode(200)
                .body("url", equalTo("https://example.com/a"));

        // List
        given()
        .when()
                .get("/api/links")
        .then()
                .statusCode(200)
                .header("X-Total-Count", notNullValue())
                .body("size()", greaterThanOrEqualTo(1));

        // Update
        String up = "{" +
                "\"status\":\"KEEP\"}";

        given()
                .contentType(ContentType.JSON)
                .body(up)
        .when()
                .put("/api/links/" + id)
        .then()
                .statusCode(200)
                .body("status", equalTo("KEEP"));

        // Delete
        given()
        .when()
                .delete("/api/links/" + id)
        .then()
                .statusCode(204);

        // Not found after delete
        given()
        .when()
                .get("/api/links/" + id)
        .then()
                .statusCode(404);
    }

    @Test
    void validationAndDuplicate() {
        // Missing fields
        given()
                .contentType(ContentType.JSON)
                .body("{}")
        .when()
                .post("/api/links")
        .then()
                .statusCode(400);

        // Create first
        String body = "{" +
                "\"title\":\"Title 1\"," +
                "\"url\":\"https://example.com/a\"}";
        given().contentType(ContentType.JSON).body(body)
        .when()
                .post("/api/links")
        .then()
                .statusCode(201);

        // Duplicate URL
        given().contentType(ContentType.JSON).body(body)
        .when()
                .post("/api/links")
        .then()
                .statusCode(409);
    }
}
