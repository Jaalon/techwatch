package org.jaalon.tags;

import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/tags")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TagResource {

    @Inject
    TagRepository repository;

    @GET
    public List<Tag> list(@QueryParam("q") String q,
                          @QueryParam("limit") @DefaultValue("20") int limit) {
        if (q != null && !q.isBlank()) {
            String like = "%" + q.toLowerCase() + "%";
            return repository.find("lower(name) like ?1", Sort.by("name").ascending(), like)
                    .page(0, Math.max(1, Math.min(100, limit)))
                    .list();
        }
        return repository.findAll(Sort.by("name").ascending()).page(0, Math.max(1, Math.min(100, limit))).list();
    }
}
