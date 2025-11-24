package org.jaalon.exchange.resources;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.exchange.ExportType;
import org.jaalon.exchange.dto.*;
import org.jaalon.exchange.services.DataExportService;
import org.jaalon.exchange.services.ImportAnalysisService;
import org.jaalon.exchange.services.ImportExecutionService;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static jakarta.ws.rs.core.Response.ok;

@Path("/api/data-exchange")
@Consumes({ MediaType.APPLICATION_JSON, "application/zip" })
@Produces(MediaType.APPLICATION_JSON)
@RegisterForReflection(targets = {
        ApiKeyExport.class,
        LlmConfigExport.class,
        PromptExport.class,
        LinkExport.class,
        TechWatchExport.class,
        TagExport.class,
        AnalyzeReport.class,
        ConflictItem.class,
        ResolveRequest.class
})
public class DataExchangeResource {
    @Inject
    DataExportService dataExportService;
    @Inject
    ImportAnalysisService importAnalysisService;
    @Inject
    ImportExecutionService importExecutionService;

    @GET
    @Path("/export/{type}")
    @Produces("application/zip")
    public Response exportZip(@PathParam("type") String type) {
        byte[] content = dataExportService.buildExportZip(ExportType.fromString(type));
        String fileName = "export-" + type.toLowerCase(Locale.ROOT) + ".zip";
        String contentDispositionHeader = "attachment; filename=\"" + URLEncoder.encode(fileName, StandardCharsets.UTF_8) + "\"";
        return ok(content)
                .type("application/zip")
                .header("Content-Disposition", contentDispositionHeader)
                .build();
    }

    @POST
    @Path("/import/analyze")
    @Consumes("application/zip")
    @Transactional
    public AnalyzeReport analyzeZip(InputStream inputStream) {
        return importAnalysisService.analyzeZip(inputStream);
    }

    /**
     * Resolve a single conflicting item by applying the chosen values.
     */
    @POST
    @Path("/import/resolve")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public Response resolveOne(ResolveRequest req) {
        importExecutionService.resolveOne(req);
        return Response.noContent().build();
    }

    /**
     * Build and return a ZIP containing only the provided resolved items.
     */
    @POST
    @Path("/export/conflicts")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces("application/zip")
    public Response exportSelectedAsZip(List<ResolveRequest> items) {
        byte[] zip = dataExportService.exportSelectedItemsZip(items);
        String cd = "attachment; filename=\"conflicts.zip\"";
        return ok(zip).type("application/zip").header("Content-Disposition", cd).build();
    }

    @POST
    @Path("/import/execute")
    @Consumes("application/zip")
    @Transactional
    public Response executeZip(InputStream in) {
        importExecutionService.executeZip(in);
        return ok(Map.of("status", "ok")).build();
    }
}
