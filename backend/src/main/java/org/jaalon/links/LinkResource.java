package org.jaalon.links;

import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.logging.Log;
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
import org.jaalon.links.dto.LinkUpsertContentDTO;
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
                         @QueryParam("sort") @DefaultValue("date") String sortParam,
                         @QueryParam("withoutTw") @DefaultValue("false") boolean withoutTw) {
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
            String where = "status = ?1 and (lower(title) like ?2 or lower(description) like ?2)";
            if (withoutTw) where += " and techWatches is empty";
            query = repository.find(where, sort, st, like);
        } else if (hasStatus) {
            LinkStatus st;
            try {
                st = LinkStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
            String where = "status = ?1";
            if (withoutTw) where += " and techWatches is empty";
            query = repository.find(where, sort, st);
        } else if (hasQuery) {
            String like = "%" + q.toLowerCase() + "%";
            String where = "(lower(title) like ?1 or lower(description) like ?1)";
            if (withoutTw) where += " and techWatches is empty";
            query = repository.find(where, sort, like);
        } else {
            if (withoutTw) {
                query = repository.find("techWatches is empty", sort);
            } else {
                query = repository.findAll(sort);
            }
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

    /**
     * Returns whether the given link already belongs to any ACTIVE TechWatch.
     * This avoids ambiguous client-side flags like inActiveTw/inActive/etc.
     */
    @GET
    @Path("/{id}/in-active-techwatch")
    public java.util.Map<String, Object> isInActiveTechWatch(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        var em = repository.getEntityManager();
        Long count = em.createQuery(
                "select count(l) from Link l join l.techWatches t where l.id = :id and t.status = :status",
                Long.class)
            .setParameter("id", id)
            .setParameter("status", org.jaalon.techwatch.TechWatchStatus.ACTIVE)
            .getSingleResult();
        boolean inActive = count != null && count > 0L;
        return java.util.Map.of("inActiveTechWatch", inActive);
    }

    /** Returns whether the given link belongs to any TechWatch (regardless of status). */
    @GET
    @Path("/{id}/in-any-techwatch")
    public java.util.Map<String, Object> isInAnyTechWatch(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        var em = repository.getEntityManager();
        Long count = em.createQuery(
                "select count(l) from Link l join l.techWatches t where l.id = :id",
                Long.class)
            .setParameter("id", id)
            .getSingleResult();
        boolean inAny = count != null && count > 0L;
        return java.util.Map.of("inAnyTechWatch", inAny);
    }

    @POST
    @Transactional
    public Response create(@Valid LinkCreateDTO dto) {
        if (dto != null) {
            Log.infof("Creating link: title='%s', url='%s'", dto.title, dto.url);
        }
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

    // Upsert by URL and optional content with lastModified comparison
    @POST
    @Path("/upsert-content")
    @Transactional
    public Response upsertContent(@Valid LinkUpsertContentDTO dto) {
        Log.infof("upsertContent called: dto=%s", dto != null ?
                String.format("url='%s', title='%s', description='%s', content=%s, lastModified=%s, nonTextual=%s",
                        dto.url, dto.title, dto.description,
                        dto.content != null ? ("present, length=" + dto.content.length()) : "null",
                        dto.lastModified, dto.nonTextual)
                : "null");

        // Log submitted content (truncate to avoid excessive logs)
        if (dto != null) {
            String title = dto.title;
            String url = dto.url;
            String content = dto.content;
            if (content != null) {
                int len = content.length();
                int limit = 2000;
                String preview = content.substring(0, Math.min(limit, len));
                String suffix = len > limit ? " …[truncated]" : "";
                Log.infof("Upsert content received: url='%s', title='%s', contentLength=%d, preview=\"%s\"%s", url, title, len, preview, suffix);
            } else {
                Log.infof("Upsert content received: url='%s', title='%s', no content provided", url, title);
            }
        }
        if (dto.nonTextual != null && dto.nonTextual) {
            // Client indicates non-textual; ensure link exists but do not store content
            Link link = repository.find("url = ?1", dto.url).firstResult();
            if (link == null) {
                link = new Link();
                link.url = dto.url;
                link.title = dto.title != null ? dto.title : dto.url;
                link.description = dto.description;
                link.status = LinkStatus.TO_PROCESS;
                link.date = Instant.now();
                link.updatedAt = Instant.now();
                repository.persist(link);
                return Response.created(URI.create("/api/links/" + link.id)).entity(link).build();
            }
            return Response.ok(link).build();
        }

        Link link = repository.find("url = ?1", dto.url).firstResult();
        Log.infof("Link null or not ? %s", link);
        boolean isNew = false;
        if (link == null) {
            link = new Link();
            link.url = dto.url;
            link.title = dto.title != null ? dto.title : dto.url;
            link.description = dto.description;
            link.status = LinkStatus.TO_PROCESS;
            link.date = Instant.now();
            link.updatedAt = Instant.now();
            isNew = true;
        }

        // Decide whether to update content based on lastModified vs updatedAt
        boolean shouldUpdateContent = isNew || dto.lastModified == null || link.updatedAt == null || dto.lastModified.isAfter(link.updatedAt);
        Log.infof("Should update content: %s", shouldUpdateContent);
        // If client provides no content, we won't touch existing content
        if (shouldUpdateContent && dto.content != null) {
            link.content = dto.content;
            link.updatedAt = Instant.now();
        }

        Log.infof("Will save link: %s",
                String.format("url='%s', title='%s', description='%s', content=%s, lastModified=%s",
                        link.url, link.title, link.description,
                        link.content,
                        link.updatedAt));

        if (isNew) {
            repository.persist(link);
            return Response.created(URI.create("/api/links/" + link.id)).entity(link).build();
        }
        return Response.ok(link).build();
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
        // Use stored content instead of URL; error if content missing
        if (link.content == null || link.content.isBlank()) {
            throw new BadRequestException("Le contenu de ce lien n'est pas disponible en base. Veuillez d'abord enregistrer le contenu.");
        }
        link.summary = summarizationService.summarize(link.content);
        return link;
    }

    @DELETE
    @Path("/{id}/summary")
    @Transactional
    public Link invalidateSummary(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        link.summary = null;
        return link;
    }

    // --- Content management (Markdown) ---
    @PUT
    @Path("/{id}/content")
    @Consumes(MediaType.TEXT_PLAIN)
    @Transactional
    public Link setContent(@PathParam("id") Long id, String markdown) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        link.content = markdown; // may be null or large; stored as CLOB
        return link;
    }

    @GET
    @Path("/{id}/content")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getContent(@PathParam("id") Long id) {
        Link link = repository.findById(id);
        if (link == null) throw new NotFoundException();
        String body = link.content == null ? "" : link.content;
        return Response.ok(body).type(MediaType.TEXT_PLAIN).build();
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
