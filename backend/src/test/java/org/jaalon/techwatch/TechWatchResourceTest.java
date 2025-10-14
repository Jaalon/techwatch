package org.jaalon.techwatch;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.jaalon.links.LinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class TechWatchResourceTest {

    @jakarta.inject.Inject
    org.jaalon.techwatch.TechWatchRepository techWatchRepository;

    @jakarta.inject.Inject
    LinkRepository linkRepo;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        // order matters due to FKs if any; here we just clear both
        linkRepo.deleteAll();
        techWatchRepository.deleteAll();
    }

    @Test
    void createRequiresDate_andListAndGet() {
        // Missing body
        given()
                .contentType(ContentType.JSON)
                .body("{}")
        .when()
                .post("/api/techwatch")
        .then()
                .statusCode(400);

        String body = "{" +
                "\"date\":\"2025-10-13\"}";

        long id =
        given()
                .contentType(ContentType.JSON)
                .body(body)
        .when()
                .post("/api/techwatch")
        .then()
                .statusCode(201)
                .body("status", equalTo("PLANNED"))
                .extract().jsonPath().getLong("id");

        given()
        .when()
                .get("/api/techwatch")
        .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(1));

        given()
        .when()
                .get("/api/techwatch/" + id)
        .then()
                .statusCode(200)
                .body("id", equalTo((int) id));
    }

    @Test
    void singleActiveTechEnforced_andActivationFlow() {
        // Create planned
        String body = "{" +
                "\"date\":\"2025-10-14\"}";
        long id = given().contentType(ContentType.JSON).body(body)
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // No active yet
        given().when().get("/api/techwatch/active").then().statusCode(204);

        // Activate
        given().when().post("/api/techwatch/" + id + "/activate")
                .then().statusCode(200)
                .body("status", equalTo("ACTIVE"));

        // Active endpoint returns it
        given().when().get("/api/techwatch/active")
                .then().statusCode(200)
                .body("id", equalTo((int) id));

        // Creating another ACTIVE directly should 409
        String activeBody = "{" +
                "\"date\":\"2025-10-15\"," +
                "\"status\":\"ACTIVE\"}";
        given().contentType(ContentType.JSON).body(activeBody)
                .when().post("/api/techwatch").then().statusCode(409);

        // Activating another should also 409
        long id2 = given().contentType(ContentType.JSON)
                .body("{\"date\":\"2025-10-16\"}")
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        given().when().post("/api/techwatch/" + id2 + "/activate").then().statusCode(409);

        // Complete the first
        given().when().post("/api/techwatch/" + id + "/complete")
                .then().statusCode(200).body("status", equalTo("COMPLETED"));

        // Now we can activate the second
        given().when().post("/api/techwatch/" + id2 + "/activate")
                .then().statusCode(200).body("status", equalTo("ACTIVE"));
    }

    @Test
    void collectNextLinksAttachesAndMarksKeep() {
        // Create active TechWatch
        long techWatchId = given().contentType(ContentType.JSON)
                .body("{\"date\":\"2025-10-14\"}")
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        given().when().post("/api/techwatch/" + techWatchId + "/activate").then().statusCode(200);

        // Create two links and set status NEXT_TechWatch
        long l1 = given().contentType(ContentType.JSON)
                .body("{\"title\":\"T1\",\"url\":\"https://ex/a\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        long l2 = given().contentType(ContentType.JSON)
                .body("{\"title\":\"T2\",\"url\":\"https://ex/b\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        given().contentType(ContentType.JSON)
                .body("{\"status\":\"NEXT_TECHWATCH\"}")
                .when().put("/api/links/" + l1).then().statusCode(200)
                .body("status", equalTo("NEXT_TECHWATCH"));
        given().contentType(ContentType.JSON)
                .body("{\"status\":\"NEXT_TECHWATCH\"}")
                .when().put("/api/links/" + l2).then().statusCode(200)
                .body("status", equalTo("NEXT_TECHWATCH"));

        // Collect
        given().when().post("/api/techwatch/" + techWatchId + "/collect-next-links")
                .then().statusCode(200);

        // Verify links are KEEP and associated
        given().when().get("/api/links/" + l1)
                .then().statusCode(200)
                .body("status", equalTo("KEEP"))
                .body("techwatchId", equalTo((int) techWatchId));
        given().when().get("/api/links/" + l2)
                .then().statusCode(200)
                .body("status", equalTo("KEEP"))
                .body("techwatchId", equalTo((int) techWatchId));
    }
}
