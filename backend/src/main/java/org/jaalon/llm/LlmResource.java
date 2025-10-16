package org.jaalon.llm;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        return Response.created(URI.create("/api/llm/configs/" + c.id)).entity(ViewDTO.from(c)).build();
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
}
