package org.jaalon.data;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.jaalon.api.DataExchangeResource;
import org.jaalon.config.PromptInstruction;
import org.jaalon.config.PromptInstructionRepository;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.tags.Tag;
import org.jaalon.tags.TagRepository;
import org.jaalon.techwatch.TechWatch;
import org.jaalon.techwatch.TechWatchRepository;
import org.jaalon.techwatch.TechWatchStatus;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class DataExchangeResourceTest {

    @Inject PromptInstructionRepository promptRepo;
    @Inject TechWatchRepository techWatchRepo;
    @Inject TagRepository tagRepo;
    @Inject LinkRepository linkRepo;

    private byte[] zipOf(String name, String json) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry(name));
            zos.write(json.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    private Set<String> zipEntryNames(byte[] zipBytes) throws IOException {
        Set<String> names = new HashSet<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                names.add(e.getName());
            }
        }
        return names;
    }

    @Test
    void exportStructure_containsExpectedFiles() throws Exception {
        byte[] techZip = given().when()
                .get("/api/data-exchange/export/technical")
                .then().statusCode(200)
                .extract().asByteArray();
        Set<String> techNames = zipEntryNames(techZip);
        assertTrue(techNames.contains(DataExchangeResource.FILE_API_KEYS));
        assertTrue(techNames.contains(DataExchangeResource.FILE_LLM_CONFIGS));
        assertTrue(techNames.contains(DataExchangeResource.FILE_PROMPTS));

        byte[] funcZip = given().when()
                .get("/api/data-exchange/export/functional")
                .then().statusCode(200)
                .extract().asByteArray();
        Set<String> funcNames = zipEntryNames(funcZip);
        assertTrue(funcNames.contains(DataExchangeResource.FILE_LINKS));
        assertTrue(funcNames.contains(DataExchangeResource.FILE_TECHWATCHES));
        assertTrue(funcNames.contains(DataExchangeResource.FILE_TAGS));
    }

    @Test
    @jakarta.transaction.Transactional
    void analyze_detectsPromptInstructionConflictOnStringId() throws Exception {
        // Seed an instruction with type "summary"
        PromptInstruction pi = new PromptInstruction();
        pi.type = "summary"; // note: distinct from default "summarize"
        pi.content = "A";
        promptRepo.persist(pi);

        // Incoming ZIP with conflicting same id but different content
        String promptsJson = "[ {\"type\":\"summary\", \"content\":\"B\"} ]";
        byte[] zip = zipOf(DataExchangeResource.FILE_PROMPTS, promptsJson);

        given().contentType("application/zip").body(zip)
        .when().post("/api/data-exchange/import/analyze")
        .then().statusCode(200)
            .body("conflicts.find { it.entity == 'PromptInstruction' && it.key == 'summary' }", notNullValue())
            .body("newItems.find { it.entity == 'PromptInstruction' && it.key == 'summary' }", nullValue());
    }

    @Test
    @jakarta.transaction.Transactional
    void execute_demotesImportedActiveTechWatchIfOneExists() throws Exception {
        // Pre-exist an ACTIVE techwatch
        TechWatch active = new TechWatch();
        active.date = LocalDate.now();
        active.status = TechWatchStatus.ACTIVE;
        active.maxArticles = 10;
        techWatchRepo.persist(active);

        // Import another ACTIVE techwatch on another date
        LocalDate importedDate = LocalDate.now().plusDays(1);
        String twJson = "[ {\"date\":\"" + importedDate + "\", \"status\":\"ACTIVE\", \"maxArticles\": 8, \"linkUrls\": [] } ]";
        byte[] zip = zipOf(DataExchangeResource.FILE_TECHWATCHES, twJson);

        given().contentType("application/zip").body(zip)
        .when().post("/api/data-exchange/import/execute")
        .then().statusCode(200);

        TechWatch imported = techWatchRepo.find("date", importedDate).firstResult();
        assertNotNull(imported, "Imported TechWatch should exist");
        assertEquals(TechWatchStatus.PLANNED, imported.status, "Imported ACTIVE must be demoted to PLANNED");
    }

    @Test
    @jakarta.transaction.Transactional
    void tags_areImportedAndLinkedToLinks() throws Exception {
        // Prepare ZIP with tags and one link using them
        String tagsJson = "[ {\"name\":\"java\"}, {\"name\":\"ai\"} ]";
        String linksJson = "[ {\"title\":\"T\", \"url\":\"http://ex\", \"description\":\"D\", \"summary\":\"S\", \"tags\":[\"java\",\"ai\"] } ]";

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry(DataExchangeResource.FILE_TAGS));
            zos.write(tagsJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
            zos.putNextEntry(new ZipEntry(DataExchangeResource.FILE_LINKS));
            zos.write(linksJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        byte[] zip = baos.toByteArray();

        given().contentType("application/zip").body(zip)
        .when().post("/api/data-exchange/import/execute")
        .then().statusCode(200);

        Tag java = tagRepo.find("name","java").firstResult();
        Tag ai = tagRepo.find("name","ai").firstResult();
        assertNotNull(java);
        assertNotNull(ai);
        Link link = linkRepo.find("url","http://ex").firstResult();
        assertNotNull(link);
        assertThat(link.tags.stream().map(t->t.name).toList(), containsInAnyOrder("java","ai"));
    }

    // Helper to persist within a transaction
    @jakarta.transaction.Transactional
    PromptInstruction seedPrompt(String type, String content) {
            PromptInstruction existing = promptRepo.findById(type);
            if (existing == null) {
                PromptInstruction pi = new PromptInstruction();
                pi.type = type;
                pi.content = content;
                promptRepo.persist(pi);
                return pi;
            } else {
                existing.content = content;
                return existing;
            }
    }

    @Test
    void resolveOne_updatesPromptInstruction() {
        // Seed existing prompt with content A in its own transaction
        seedPrompt("summarize", "A");

        String payload = "{\n" +
                "  \"entity\": \"PromptInstruction\",\n" +
                "  \"key\": \"summarize\",\n" +
                "  \"data\": { \"content\": \"B\" }\n" +
                "}";

        given().contentType(ContentType.JSON).body(payload)
                .when().post("/api/data-exchange/import/resolve")
                .then().statusCode(204);

        PromptInstruction updated = promptRepo.findById("summarize");
        assertNotNull(updated);
        assertEquals("B", updated.content);
    }
}
