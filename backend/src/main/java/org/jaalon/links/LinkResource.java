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
import org.jaalon.tags.Tag;
import org.jaalon.tags.TagRepository;

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

    @Inject
    org.jaalon.techwatch.TechWatchService techWatchService;

    @Inject
    TagRepository tagRepository;

    @Inject
    SummarizationService summarizationService;

    @GET
    public Response list(@QueryParam("status") String status,
                         @QueryParam("q") String q,
                         @QueryParam("page") @DefaultValue("0") int page,
                         @QueryParam("size") @DefaultValue("20") int size,
                         @QueryParam("sort") @DefaultValue("date") String sortParam) {
        PanacheQuery<Link> query;
        Sort sort = mapSort(sortParam);
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasQuery = q != null && !q.isBlank();

        if (hasStatus && hasQuery) {
            LinkStatus st;
            try {
                st = LinkStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
            // Case-insensitive search on title or description
            String like = "%" + q.toLowerCase() + "%";
            query = repository.find("status = ?1 and (lower(title) like ?2 or lower(description) like ?2)", sort, st, like);
        } else if (hasStatus) {
            LinkStatus st;
            try {
                st = LinkStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
            query = repository.find("status = ?1", sort, st);
        } else if (hasQuery) {
            String like = "%" + q.toLowerCase() + "%";
            query = repository.find("lower(title) like ?1 or lower(description) like ?1", sort, like);
        } else {
            query = repository.findAll(sort);
        }
        query.page(Page.of(page, size));
        List<Link> list = query.list();
        return Response.ok(list).header("X-Total-Count", query.count()).build();
    }

    private Sort mapSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank() || sortParam.equalsIgnoreCase("date")) {
            return Sort.by("date").descending();
        }
        if (sortParam.equalsIgnoreCase("title")) {
            return Sort.by("title").ascending();
        }
        if (sortParam.equalsIgnoreCase("source") || sortParam.equalsIgnoreCase("url")) {
            return Sort.by("url").ascending();
        }
        throw new BadRequestException("Invalid sort value");
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

    @POST
    @Path("/{id}/summarize")
    @Consumes(MediaType.WILDCARD)
    @Transactional
    public Link summarize(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        String summary = summarizationService.summarize(link.url);
        link.summary = summary;
        return link;
    }

    @POST
    @Path("/{id}/assign-next")
    @Consumes(MediaType.WILDCARD)
    @Transactional
    public Response assignToNext(@PathParam("id") Long id) {
        org.jaalon.techwatch.TechWatch tw = techWatchService.assignLinkToNext(id);
        return Response.ok(tw).build();
    }

    // --- Tag management on links ---
    public static class TagNameDTO { public String name; }

    @POST
    @Path("/{id}/tags")
    @Transactional
    public Link addTag(@PathParam("id") Long id, TagNameDTO dto) {
        if (dto == null || dto.name == null || dto.name.isBlank()) {
            throw new BadRequestException("Tag name is required");
        }
        String name = dto.name.trim();
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        Tag tag = tagRepository.find("lower(name) = ?1", name.toLowerCase()).firstResult();
        if (tag == null) {
            tag = new Tag();
            tag.name = name;
            tagRepository.persist(tag);
        }
        link.tags.add(tag);
        return link;
    }

    @DELETE
    @Path("/{id}/tags/{name}")
    @Transactional
    public Link removeTag(@PathParam("id") Long id, @PathParam("name") String name) {
        if (name == null || name.isBlank()) throw new BadRequestException("Tag name is required");
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        Tag tag = tagRepository.find("lower(name) = ?1", name.toLowerCase()).firstResult();
        if (tag != null) {
            link.tags.remove(tag);
        }
        return link;
    }
}
