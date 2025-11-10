package org.jaalon.apikey;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.llm.dto.ApiKeyCreateDto;
import org.jaalon.llm.dto.ApiKeyFullViewDto;
import org.jaalon.llm.dto.ApiKeyViewDto;

import java.net.URI;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static jakarta.ws.rs.core.Response.*;

/**
 * CRUD for reusable AI provider API keys (Perplexity, OpenAI, Mistral).
 */
@Path("/api/ai-keys")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AiApiKeyResource {

    public static final Set<String> PROVIDERS = Set.of("perplexity", "openai", "mistral");

    @Inject
    AiApiKeyRepository repository;

    @GET
    public List<ApiKeyViewDto> list() {
        return repository.listAll().stream().map(ApiKeyViewDto::from).collect(Collectors.toList());
    }

    private static String trimOrNull(String s) { return s == null ? null : s.trim(); }

    private void validate(ApiKeyCreateDto apiKeyCreateDto) {
        if (apiKeyCreateDto == null) throw new BadRequestException("Body is required");
        apiKeyCreateDto.provider = trimOrNull(apiKeyCreateDto.provider);
        apiKeyCreateDto.name = trimOrNull(apiKeyCreateDto.name);
        apiKeyCreateDto.baseUrl = trimOrNull(apiKeyCreateDto.baseUrl);
        apiKeyCreateDto.apiKey = trimOrNull(apiKeyCreateDto.apiKey);
        apiKeyCreateDto.organizationId = trimOrNull(apiKeyCreateDto.organizationId);
        apiKeyCreateDto.projectId = trimOrNull(apiKeyCreateDto.projectId);

        if (apiKeyCreateDto.provider == null || apiKeyCreateDto.provider.isBlank()) throw new BadRequestException("provider is required");
        if (!PROVIDERS.contains(apiKeyCreateDto.provider.toLowerCase())) throw new BadRequestException("provider must be one of: " + PROVIDERS);
        if (apiKeyCreateDto.name == null || apiKeyCreateDto.name.isBlank()) throw new BadRequestException("name is required");
        if (apiKeyCreateDto.baseUrl == null || apiKeyCreateDto.baseUrl.isBlank()) throw new BadRequestException("baseUrl is required");
        if (apiKeyCreateDto.apiKey == null || apiKeyCreateDto.apiKey.isBlank()) throw new BadRequestException("apiKey is required");
    }

    @POST
    @Transactional
    public Response create(@Valid ApiKeyCreateDto apiKeyCreateDto) {
        validate(apiKeyCreateDto);
        AiApiKey aiApiKey = new AiApiKey();
        aiApiKey.provider = apiKeyCreateDto.provider.toLowerCase();
        aiApiKey.name = apiKeyCreateDto.name;
        aiApiKey.baseUrl = apiKeyCreateDto.baseUrl;
        aiApiKey.apiKey = apiKeyCreateDto.apiKey;
        aiApiKey.organizationId = apiKeyCreateDto.organizationId;
        aiApiKey.projectId = apiKeyCreateDto.projectId;
        repository.persist(aiApiKey);

        return created(URI.create("/api/ai-keys/" + aiApiKey.id)).entity(ApiKeyViewDto.from(aiApiKey)).build();
    }

    @GET
    @Path("/{id}")
    public ApiKeyFullViewDto getOne(@PathParam("id") Long id) {
        if (id == null) throw new BadRequestException("id is required");
        AiApiKey aiApiKey = repository.findById(id);
        if (aiApiKey == null) throw new NotFoundException();
        return ApiKeyFullViewDto.from(aiApiKey);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public ApiKeyViewDto update(@PathParam("id") Long id, @Valid ApiKeyCreateDto apiKeyCreateDto) {
        if (id == null) throw new BadRequestException("id is required");
        validate(apiKeyCreateDto);
        AiApiKey aiApiKey = repository.findById(id);
        if (aiApiKey == null) throw new NotFoundException();
        aiApiKey.provider = apiKeyCreateDto.provider.toLowerCase();
        aiApiKey.name = apiKeyCreateDto.name;
        aiApiKey.baseUrl = apiKeyCreateDto.baseUrl;
        aiApiKey.apiKey = apiKeyCreateDto.apiKey;
        aiApiKey.organizationId = apiKeyCreateDto.organizationId;
        aiApiKey.projectId = apiKeyCreateDto.projectId;
        return ApiKeyViewDto.from(aiApiKey);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        AiApiKey aiApiKey = repository.findById(id);
        if (aiApiKey == null) throw new NotFoundException();
        repository.delete(aiApiKey);
        return noContent().build();
    }
}
