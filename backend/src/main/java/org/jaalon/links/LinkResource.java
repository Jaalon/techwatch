package org.jaalon.links;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.links.dto.LinkCreateDTO;
import org.jaalon.links.dto.LinkUpdateDTO;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Path("/api/links")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LinkResource {

    @Inject
    LinkRepository repository;

    @GET
    public Response list(@QueryParam("status") String status,
                         @QueryParam("page") @DefaultValue("0") int page,
                         @QueryParam("size") @DefaultValue("20") int size) {
        PanacheQuery<Link> query;
        Sort sort = Sort.by("date").descending();
        if (status != null && !status.isBlank()) {
            LinkStatus st;
            try {
                st = LinkStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
            query = repository.find("status = ?1", sort, st);
        } else {
            query = repository.findAll(sort);
        }
        query.page(Page.of(page, size));
        List<Link> list = query.list();
        return Response.ok(list).header("X-Total-Count", query.count()).build();
    }

    @GET
    @Path("/{id}")
    public Link get(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        return link;
    }

    @POST
    @Transactional
    public Response create(@Valid LinkCreateDTO dto) {
        // check duplicate URL
        Optional<Link> existing = repository.find("url = ?1", dto.url).firstResultOptional();
        if (existing.isPresent()) {
            throw new ClientErrorException("URL already exists", 409);
        }
        Link link = new Link();
        link.title = dto.title;
        link.url = dto.url;
        link.description = dto.description;
        link.status = LinkStatus.TO_PROCESS;
        link.date = Instant.now();
        repository.persist(link);
        return Response.created(URI.create("/api/links/" + link.id)).entity(link).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Link update(@PathParam("id") Long id, @Valid LinkUpdateDTO dto) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        if (dto.title != null) link.title = dto.title;
        if (dto.url != null) link.url = dto.url;
        if (dto.description != null) link.description = dto.description;
        if (dto.status != null) link.status = dto.status;
        return link;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        boolean deleted = repository.deleteById(id);
        if (!deleted) throw new NotFoundException();
        return Response.noContent().build();
    }
}
