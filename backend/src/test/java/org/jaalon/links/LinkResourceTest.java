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

    @Test
    void paginationAndSortingAndHeaders() throws InterruptedException {
        // Create three links with small delays to ensure different timestamps
        for (int i = 1; i <= 3; i++) {
            String body = "{" +
                    "\"title\":\"Item " + i + "\"," +
                    "\"url\":\"https://example.com/p" + i + "\"," +
                    "\"description\":\"D" + i + "\"}";
            given().contentType(ContentType.JSON).body(body)
            .when().post("/api/links")
            .then().statusCode(201);
            Thread.sleep(5); // ensure date difference
        }
        // Request page size 2, page 0
        given()
        .when()
            .get("/api/links?size=2&page=0")
        .then()
            .statusCode(200)
            .header("X-Total-Count", equalTo("3"))
            // Sorted by date desc: last created first => Item 3 then Item 2
            .body("[0].title", equalTo("Item 3"))
            .body("[1].title", equalTo("Item 2"))
            .body("size()", equalTo(2));

        // Page 1 should contain the remaining one
        given()
        .when()
            .get("/api/links?size=2&page=1")
        .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Item 1"));
    }

    @Test
    void filterByStatus() {
        // Create two links and update status of one to KEEP
        String a = "{" +
                "\"title\":\"A\"," +
                "\"url\":\"https://example.com/s1\"}";
        long id =
            given().contentType(ContentType.JSON).body(a)
            .when().post("/api/links")
            .then().statusCode(201).extract().jsonPath().getLong("id");

        String b = "{" +
                "\"title\":\"B\"," +
                "\"url\":\"https://example.com/s2\"}";
        given().contentType(ContentType.JSON).body(b)
            .when().post("/api/links")
            .then().statusCode(201);

        // Update first to KEEP
        given().contentType(ContentType.JSON).body("{\"status\":\"KEEP\"}")
            .when().put("/api/links/" + id)
            .then().statusCode(200).body("status", equalTo("KEEP"));

        // Filter KEEP
        given()
        .when()
            .get("/api/links?status=KEEP")
        .then()
            .statusCode(200)
            .body("size()", greaterThanOrEqualTo(1))
            .body("status", everyItem(equalTo("KEEP")));

        // Invalid status => 400
        given()
        .when()
            .get("/api/links?status=INVALID")
        .then()
            .statusCode(400);
    }

    @Test
    void simpleSearchQueryWithAndWithoutStatus() {
        // Create three links with different titles/descriptions/status
        given().contentType(ContentType.JSON).body("{\"title\":\"Quarkus Guide\",\"url\":\"https://example.com/q1\",\"description\":\"Learn REST\"}")
            .when().post("/api/links").then().statusCode(201);
        long idKeep = given().contentType(ContentType.JSON).body("{\"title\":\"Spring Tips\",\"url\":\"https://example.com/q2\",\"description\":\"Quarkus vs Spring\"}")
            .when().post("/api/links").then().statusCode(201).extract().jsonPath().getLong("id");
        given().contentType(ContentType.JSON).body("{\"title\":\"Other\",\"url\":\"https://example.com/q3\",\"description\":\"misc topic\"}")
            .when().post("/api/links").then().statusCode(201);

        // Make second KEEP
        given().contentType(ContentType.JSON).body("{\"status\":\"KEEP\"}")
            .when().put("/api/links/" + idKeep).then().statusCode(200);

        // Search by q across title/description (case-insensitive)
        given()
        .when()
            .get("/api/links?q=quarkus")
        .then()
            .statusCode(200)
            .body("size()", equalTo(2))
            .body("title", hasItems("Quarkus Guide", "Spring Tips"));

        // Combine q with status filter
        given()
        .when()
            .get("/api/links?q=quarkus&status=KEEP")
        .then()
            .statusCode(200)
            .body("size()", equalTo(1))
            .body("[0].title", equalTo("Spring Tips"));
    }

    @Test
    void sortByTitleAscending() {
        // Create two with titles B then A
        given().contentType(ContentType.JSON)
            .body("{\"title\":\"B title\",\"url\":\"https://example.com/sort-b\"}")
            .when().post("/api/links").then().statusCode(201);
        given().contentType(ContentType.JSON)
            .body("{\"title\":\"A title\",\"url\":\"https://example.com/sort-a\"}")
            .when().post("/api/links").then().statusCode(201);

        // Request with sort=title, expect A then B
        given()
        .when()
            .get("/api/links?sort=title&size=10&page=0")
        .then()
            .statusCode(200)
            .body("[0].title", startsWith("A"))
            .body("[1].title", startsWith("B"));
    }

}
