package org.jaalon.llm;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static jakarta.ws.rs.core.Response.*;

@Path("/api/llm")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LlmResource {

    public static class CreateDTO {
        public String name;
        public String baseUrl;
        public String apiKey;
        public String model; // required
    }

    public static class ViewDTO {
        public Long id;
        public String name;
        public String baseUrl;
        public String model;
        public boolean isDefault;
        public static ViewDTO from(LlmConfig c) {
            ViewDTO v = new ViewDTO();
            v.id = c.id;
            v.name = c.name;
            v.baseUrl = c.baseUrl;
            v.model = c.model;
            v.isDefault = c.isDefault;
            return v;
        }
    }

    @Inject
    LlmConfigRepository repository;

    @Inject
    PerplexityService perplexityService;

    @GET
    @Path("/models")
    public Map<String, Object> listModels(@QueryParam("baseUrl") String baseUrl,
                                          @QueryParam("apiKey") String apiKey) {
        if (baseUrl == null || baseUrl.isBlank()) throw new BadRequestException("baseUrl is required");
        if (apiKey == null || apiKey.isBlank()) throw new BadRequestException("apiKey is required");
        List<String> models = perplexityService.listModels(baseUrl, apiKey);
        Map<String, Object> res = new HashMap<>();
        res.put("models", models);
        return res;
    }

    @GET
    @Path("/configs")
    public List<ViewDTO> listConfigs() {
        return repository.listAll().stream().map(ViewDTO::from).collect(Collectors.toList());
    }

    @POST
    @Path("/configs")
    @Transactional
    public Response createConfig(@Valid CreateDTO dto) {
        if (dto == null) throw new BadRequestException("Body is required");
        if (dto.name == null || dto.name.isBlank()) throw new BadRequestException("name is required");
        if (dto.baseUrl == null || dto.baseUrl.isBlank()) throw new BadRequestException("baseUrl is required");
        if (dto.apiKey == null || dto.apiKey.isBlank()) throw new BadRequestException("apiKey is required");
        if (dto.model == null || dto.model.isBlank()) throw new BadRequestException("model is required");
        LlmConfig c = new LlmConfig();
        c.name = dto.name.trim();
        c.baseUrl = dto.baseUrl.trim();
        c.apiKey = dto.apiKey.trim();
        c.model = dto.model.trim();
        // first config becomes default if none exists
        long count = repository.count();
        c.isDefault = count == 0;
        repository.persist(c);
        return created(URI.create("/api/llm/configs/" + c.id)).entity(ViewDTO.from(c)).build();
    }

    @PUT
    @Path("/configs/{id}/default")
    @Transactional
    public ViewDTO setDefault(@PathParam("id") Long id) {
        LlmConfig target = repository.findById(id);
        if (target == null) throw new NotFoundException();
        // unset all others
        repository.findAll().list().forEach(c -> c.isDefault = false);
        target.isDefault = true;
        return ViewDTO.from(target);
    }

    @DELETE
    @Path("/configs/{id}")
    @Transactional
    public Response deleteConfig(@PathParam("id") Long id) {
        LlmConfig target = repository.findById(id);
        if (target == null) throw new NotFoundException();
        if (target.isDefault) {
            return status(Status.CONFLICT)
                    .entity(Map.of("error", "Cannot delete default configuration"))
                    .build();
        }
        repository.delete(target);
        return noContent().build();
    }

    public static class MistralModelsReq {
        public String baseUrl;
        public String apiKey;
    }

    @POST
    @Path("/mistral/models")
    public jakarta.ws.rs.core.Response mistralModels(MistralModelsReq req) {
        String baseUrl = req == null ? null : req.baseUrl;
        String apiKey = req == null ? null : req.apiKey;
        if (baseUrl == null || baseUrl.isBlank()) throw new BadRequestException("baseUrl is required");
        if (apiKey == null || apiKey.isBlank()) throw new BadRequestException("apiKey is required");
        try {
            String url = (baseUrl.endsWith("/")) ? (baseUrl + "v1/models") : (baseUrl + "/v1/models");
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> resp = client.send(httpRequest, BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            int code = resp.statusCode();
            String body = resp.body();
            if (code == 200 || code == 422) {
                return status(code).entity(body).build();
            }
            return status(502).entity("Upstream error: HTTP " + code).build();
        } catch (Exception e) {
            return status(502).entity("Failed to fetch models: " + e.getMessage()).build();
        }
    }
}
