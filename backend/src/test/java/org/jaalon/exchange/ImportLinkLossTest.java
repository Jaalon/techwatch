package org.jaalon.exchange;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.techwatch.TechWatch;
import org.jaalon.techwatch.TechWatchRepository;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class ImportLinkLossTest {

    @Inject TechWatchRepository techWatchRepo;
    @Inject LinkRepository linkRepo;

    @Test
    @Transactional
    void techWatchLinks_areImportedAndPersisted() throws Exception {
        // Prepare ZIP with a link and a techwatch referencing it
        String url = "http://test-import-link-loss";
        String linksJson = "[ {\"title\":\"T\", \"url\":\"" + url + "\", \"description\":\"D\", \"summary\":\"S\" } ]";
        LocalDate twDate = LocalDate.now().plusDays(10);
        String twJson = "[ {\"date\":\"" + twDate + "\", \"status\":\"PLANNED\", \"maxArticles\": 5, \"linkUrls\": [\"" + url + "\"] } ]";

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry(DataExchangeFiles.LINKS.fileName()));
            zos.write(linksJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
            zos.putNextEntry(new ZipEntry(DataExchangeFiles.TECHWATCHES.fileName()));
            zos.write(twJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        byte[] zip = baos.toByteArray();

        // Execute import
        given().contentType("application/zip").body(zip)
        .when().post("/api/data-exchange/import/execute")
        .then().statusCode(200);

        // Verify that the link is associated with the TechWatch
        Link link = linkRepo.find("url", url).firstResult();
        assertNotNull(link, "Link should be imported");
        
        TechWatch tw = techWatchRepo.find("date", twDate).firstResult();
        assertNotNull(tw, "TechWatch should be imported");

        assertTrue(link.techWatches != null && link.techWatches.contains(tw), "Link should be associated with TechWatch");
        
        // Final check: if we reload from DB, is it still there?
        // (Quarkus/Hibernate session might hide persistence issues, but usually listAll/find will hit DB if not in same TX)
        // Let's try to check another aspect: does it work if the TechWatch is imported BEFORE the Link?
        
        String url2 = "http://test-import-link-loss-2";
        String linksJson2 = "[ {\"title\":\"T2\", \"url\":\"" + url2 + "\", \"description\":\"D2\", \"summary\":\"S2\" } ]";
        LocalDate twDate2 = LocalDate.now().plusDays(11);
        String twJson2 = "[ {\"date\":\"" + twDate2 + "\", \"status\":\"PLANNED\", \"maxArticles\": 5, \"linkUrls\": [\"" + url2 + "\"] } ]";

        ByteArrayOutputStream baos2 = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos2)) {
            zos.putNextEntry(new ZipEntry(DataExchangeFiles.TECHWATCHES.fileName()));
            zos.write(twJson2.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
            zos.putNextEntry(new ZipEntry(DataExchangeFiles.LINKS.fileName()));
            zos.write(linksJson2.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        byte[] zip2 = baos2.toByteArray();

        given().contentType("application/zip").body(zip2)
        .when().post("/api/data-exchange/import/execute")
        .then().statusCode(200);

        Link link2 = linkRepo.find("url", url2).firstResult();
        assertNotNull(link2, "Link 2 should be imported");
        TechWatch tw2 = techWatchRepo.find("date", twDate2).firstResult();
        assertNotNull(tw2, "TechWatch 2 should be imported");
        
        assertTrue(link2.techWatches != null && link2.techWatches.contains(tw2), "Link 2 should be associated with TechWatch 2");
    }
}
