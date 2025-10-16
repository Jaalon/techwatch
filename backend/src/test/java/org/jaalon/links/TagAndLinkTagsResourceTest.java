package org.jaalon.links;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class TagAndLinkTagsResourceTest {

    @jakarta.inject.Inject
    LinkRepository linkRepository;

    @jakarta.transaction.Transactional
    @BeforeEach
    void clean() {
        linkRepository.deleteAll();
        // Tags will be deleted via cascade through join table automatically between tests due to test transaction reset
    }

    @Test
    void addNewTagToLink_createsAndAssociates() {
        long linkId = given().contentType(ContentType.JSON)
                .body("{\"title\":\"A\",\"url\":\"https://ex/t1\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        given().contentType(ContentType.JSON)
                .body("{\"name\":\"java\"}")
        .when()
                .post("/api/links/" + linkId + "/tags")
        .then()
                .statusCode(200)
                .body("tags.name", hasItem("java"));

        // Suggestions should return the new tag by prefix
        given().when().get("/api/tags?q=ja")
                .then().statusCode(200)
                .body("name", hasItem("java"));
    }

    @Test
    void addExistingTagByName_doesNotDuplicate_andRemoveAssociation() {
        long linkId = given().contentType(ContentType.JSON)
                .body("{\"title\":\"B\",\"url\":\"https://ex/t2\"}")
                .when().post("/api/links").then().statusCode(201)
                .extract().jsonPath().getLong("id");

        // First add
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"cloud\"}")
                .when().post("/api/links/" + linkId + "/tags")
                .then().statusCode(200)
                .body("tags.size()", greaterThanOrEqualTo(1))
                .body("tags.name", hasItem("cloud"));

        // Second add same name should not duplicate in link.tags
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"cloud\"}")
                .when().post("/api/links/" + linkId + "/tags")
                .then().statusCode(200)
                .body("tags.name.findAll{ it == 'cloud' }.size()", lessThanOrEqualTo(1));

        // Remove association
        given().when().delete("/api/links/" + linkId + "/tags/cloud")
                .then().statusCode(200)
                .body("tags.name", not(hasItem("cloud")));
    }
}
