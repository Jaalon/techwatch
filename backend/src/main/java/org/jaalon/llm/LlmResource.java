package org.jaalon.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.apikey.AiApiKey;
import org.jaalon.apikey.AiApiKeyRepository;
import org.jaalon.llm.dto.MistralModelsRequest;
import org.jaalon.llm.dto.llmConfigCreateDto;
import org.jaalon.llm.dto.llmConfigViewDto;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static jakarta.ws.rs.core.Response.*;

@Path("/api/llm")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LlmResource {

    @Inject
    LlmConfigRepository repository;

    @Inject
    AiApiKeyRepository aiApiKeyRepository;

    @GET
    @Path("/configs")
    public List<llmConfigViewDto> listConfigs() {
        return repository.listAll().stream().map(llmConfigViewDto::from).collect(Collectors.toList());
    }

    @POST
    @Path("/configs")
    @Transactional
    public Response createConfig(@Valid llmConfigCreateDto llmConfigCreateDto) {
        if (llmConfigCreateDto == null) throw new BadRequestException("Body is required");
        if (llmConfigCreateDto.name == null || llmConfigCreateDto.name.isBlank()) throw new BadRequestException("name is required");
        if (llmConfigCreateDto.aiApiKeyId == null) throw new BadRequestException("aiApiKeyId is required");
        if (llmConfigCreateDto.model == null || llmConfigCreateDto.model.isBlank()) throw new BadRequestException("model is required");
        AiApiKey aiApiKey = aiApiKeyRepository.findById(llmConfigCreateDto.aiApiKeyId);
        if (aiApiKey == null) throw new NotFoundException("API key not found");
        LlmConfig llmConfig = new LlmConfig();
        llmConfig.name = llmConfigCreateDto.name.trim();
        llmConfig.aiApiKey = aiApiKey;
        llmConfig.model = llmConfigCreateDto.model.trim();
        // first config becomes default if none exists
        long numberOfLlmConfig = repository.count();
        llmConfig.isDefault = numberOfLlmConfig == 0;
        repository.persist(llmConfig);
        return created(URI.create("/api/llm/configs/" + llmConfig.id)).entity(llmConfigViewDto.from(llmConfig)).build();
    }

    @PUT
    @Path("/configs/{id}")
    @Transactional
    public llmConfigViewDto updateConfig(@PathParam("id") Long id, @Valid llmConfigCreateDto llmConfigCreateDto) {
        if (id == null) throw new BadRequestException("id is required");
        if (llmConfigCreateDto == null) throw new BadRequestException("Body is required");
        if (llmConfigCreateDto.name == null || llmConfigCreateDto.name.isBlank()) throw new BadRequestException("name is required");
        if (llmConfigCreateDto.aiApiKeyId == null) throw new BadRequestException("aiApiKeyId is required");
        if (llmConfigCreateDto.model == null || llmConfigCreateDto.model.isBlank()) throw new BadRequestException("model is required");
        LlmConfig existingLlmConfig = repository.findById(id);
        if (existingLlmConfig == null) throw new NotFoundException();
        AiApiKey aiApiKey = aiApiKeyRepository.findById(llmConfigCreateDto.aiApiKeyId);
        if (aiApiKey == null) throw new NotFoundException("API key not found");
        existingLlmConfig.name = llmConfigCreateDto.name.trim();
        existingLlmConfig.aiApiKey = aiApiKey;
        existingLlmConfig.model = llmConfigCreateDto.model.trim();
        return llmConfigViewDto.from(existingLlmConfig);
    }

    @PUT
    @Path("/configs/{id}/default")
    @Transactional
    public llmConfigViewDto setDefault(@PathParam("id") Long id) {
        LlmConfig llmConfig = repository.findById(id);
        if (llmConfig == null) throw new NotFoundException();
        // unset all others
        repository.findAll().list().forEach(c -> c.isDefault = false);
        llmConfig.isDefault = true;
        return llmConfigViewDto.from(llmConfig);
    }

    @DELETE
    @Path("/configs/{id}")
    @Transactional
    public Response deleteConfig(@PathParam("id") Long id) {
        LlmConfig llmConfig = repository.findById(id);
        if (llmConfig == null) throw new NotFoundException();
        if (llmConfig.isDefault) {
            return status(Status.CONFLICT)
                    .entity(Map.of("error", "Cannot delete default configuration"))
                    .build();
        }
        repository.delete(llmConfig);
        return noContent().build();
    }

    @POST
    @Path("/mistral/models")
    public Response mistralModels(MistralModelsRequest mistralModelsRequest) {
        Long aiApiKeyId = (mistralModelsRequest == null) ? null : mistralModelsRequest.aiApiKeyId;
        if (aiApiKeyId == null) {
            throw new BadRequestException("aiApiKeyId is required");
        }

        AiApiKey aiApiKey = aiApiKeyRepository.findById(aiApiKeyId);
        if (aiApiKey == null) {
            throw new NotFoundException("API key not found");
        }

        try {
            String baseUrl = aiApiKey.baseUrl;
            String apiKey = aiApiKey.apiKey;
            String url = (baseUrl.endsWith("/")) ? (baseUrl + "v1/models") : (baseUrl + "/v1/models");
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            int code = httpResponse.statusCode();
            String body = httpResponse.body();
            if (code == 200 || code == 422) {
                return status(code).entity(body).build();
            }
            return status(502).entity("Upstream error: HTTP " + code).build();
        } catch (Exception e) {
            return status(502).entity("Failed to fetch models: " + e.getMessage()).build();
        }
    }

    @GET
    @Path("/models")
    public Response listModels(@QueryParam("aiApiKeyId") Long aiApiKeyId) {
        if (aiApiKeyId == null) {
            throw new BadRequestException("aiApiKeyId is required");
        }

        AiApiKey aiApiKey = aiApiKeyRepository.findById(aiApiKeyId);
        if (aiApiKey == null) {
            throw new NotFoundException("API key not found");
        }

        // Fallback: try to query the upstream /v1/models and normalize to { models: [...] }
        try {
            String baseUrl = aiApiKey.baseUrl;
            String apiKey = aiApiKey.apiKey;
            // If baseUrl is missing or not an HTTP(S) URL, do not attempt a network call
            if (baseUrl == null || baseUrl.isBlank()) {
                return ok(Map.of("models", List.of())).build();
            }
            String lower = baseUrl.toLowerCase();
            if (!(lower.startsWith("http://") || lower.startsWith("https://"))) {
                return ok(Map.of("models", List.of())).build();
            }
            String url = (baseUrl.endsWith("/")) ? (baseUrl + "v1/models") : (baseUrl + "/v1/models");
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(java.net.URI.create(url))
                    .header("Authorization", "Bearer " + (apiKey == null ? "" : apiKey))
                    .GET()
                    .build();
            HttpClient httpClient = HttpClient.newHttpClient();
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));
            int code = httpResponse.statusCode();
            String body = httpResponse.body();
            if (code != 200) {
                return status(502).entity(Map.of("models", List.of())).build();
            }

            // Try to parse common shapes
            try {
                ObjectMapper om = new ObjectMapper();
                JsonNode root = om.readTree(body);
                List<String> names = new ArrayList<>();
                if (root.has("data") && root.get("data").isArray()) {
                    for (JsonNode n : root.get("data")) {
                        if (n.has("id")) names.add(n.get("id").asText());
                        else if (n.has("name")) names.add(n.get("name").asText());
                    }
                } else if (root.has("models") && root.get("models").isArray()) {
                    for (JsonNode n : root.get("models")) {
                        names.add(n.asText());
                    }
                }
                return ok(Map.of("models", names)).build();
            } catch (Exception parseEx) {
                // If parsing fails, still return an empty list instead of raw body
                return ok(Map.of("models", List.of())).build();
            }
        } catch (Exception e) {
            return status(502).entity(Map.of("models", List.of())).build();
        }
    }
}
