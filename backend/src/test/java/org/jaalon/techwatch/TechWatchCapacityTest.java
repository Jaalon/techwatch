package org.jaalon.techwatch;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.jaalon.links.LinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class TechWatchCapacityTest {

    @jakarta.inject.Inject
    TechWatchRepository techWatchRepository;

    @jakarta.inject.Inject
    LinkRepository linkRepo;

    @BeforeEach
    @jakarta.transaction.Transactional
    void clean() {
        linkRepo.deleteAll();
        techWatchRepository.deleteAll();
    }

    @Test
    void defaultCapacityIs10_andSpilloverCreatesPlannedNext() {
        // Create one ACTIVE TechWatch with default capacity 10
        long id = given().contentType(ContentType.JSON)
                .body("{\"date\":\"2025-10-14\"}")
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        given().when().post("/api/techwatch/" + id + "/activate").then().statusCode(200);

        // Create 12 links and set NEXT_TECHWATCH
        for (int i = 0; i < 12; i++) {
            long lid = given().contentType(ContentType.JSON)
                    .body("{\"title\":\"T"+i+"\",\"url\":\"https://ex/"+i+"\"}")
                    .when().post("/api/links").then().statusCode(201)
                    .extract().jsonPath().getLong("id");
            given().contentType(ContentType.JSON)
                    .body("{\"status\":\"NEXT_TECHWATCH\"}")
                    .when().put("/api/links/" + lid).then().statusCode(200)
                    .body("status", equalTo("NEXT_TECHWATCH"));
        }

        // Collect -> should assign 12 with spillover to a newly created planned (+7 days)
        given().when().post("/api/techwatch/" + id + "/collect-next-links")
                .then().statusCode(200)
                .body(equalTo("12"));

        // Check active has 10 links
        given().when().get("/api/techwatch/" + id + "/links")
                .then().statusCode(200)
                .body("size()", equalTo(10));

        // There should be another TechWatch planned with remaining 2 links
        // List techwatch and find the planned one
        long plannedId = given().when().get("/api/techwatch")
                .then().statusCode(200)
                .extract().jsonPath().getLong("find { it.status == 'PLANNED' }.id");

        given().when().get("/api/techwatch/" + plannedId + "/links")
                .then().statusCode(200)
                .body("size()", equalTo(2));
    }

    @Test
    void customCapacityRespected_andAssignSingleToNext() {
        // Create PLANNED with capacity 1 on a given date
        String create = "{\"date\":\"2025-10-20\",\"maxArticles\":1}";
        long tw1 = given().contentType(ContentType.JSON).body(create)
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        // Create another PLANNED on a later date with capacity 3
        long tw2 = given().contentType(ContentType.JSON)
                .body("{\"date\":\"2025-10-27\",\"maxArticles\":3}")
                .when().post("/api/techwatch").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // Create 2 links and assign via assign-next endpoint
        long l1 = given().contentType(ContentType.JSON)
                .body("{\"title\":\"A\",\"url\":\"https://u/a\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");
        long l2 = given().contentType(ContentType.JSON)
                .body("{\"title\":\"B\",\"url\":\"https://u/b\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // First assignment should go to tw1 (capacity 1)
        given().when().post("/api/links/" + l1 + "/assign-next")
                .then().statusCode(200)
                .body("id", equalTo((int) tw1));
        // Second assignment should spill to tw2
        given().when().post("/api/links/" + l2 + "/assign-next")
                .then().statusCode(200)
                .body("id", equalTo((int) tw2));
    }
}
