package org.jaalon.techwatch;

import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.links.LinkStatus;

import java.net.URI;
import java.util.List;

@Path("/api/techwatch")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TechWatchResource {

    @Inject
    TechWatchRepository techWatchRepository;

    @Inject
    LinkRepository linkRepository;

    @GET
    public List<TechWatch> list() {
        return techWatchRepository.listAll(Sort.by("date").descending());
    }

    @GET
    @Path("/{id}")
    public TechWatch get(@PathParam("id") Long id) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        return m;
    }

    public static class CreateDTO {
        public java.time.LocalDate date;
        public TechWatchStatus status; // optional, default PLANNED
    }

    @POST
    @Transactional
    public Response create(@Valid CreateDTO dto) {
        if (dto == null || dto.date == null) {
            throw new BadRequestException("date is required");
        }
        TechWatch m = new TechWatch();
        m.date = dto.date;
        m.status = dto.status != null ? dto.status : TechWatchStatus.PLANNED;
        if (m.status == TechWatchStatus.ACTIVE) {
            // enforce single active
            long active = techWatchRepository.count("status = ?1", TechWatchStatus.ACTIVE);
            if (active > 0) throw new ClientErrorException("An active TechWatch already exists", 409);
        }
        techWatchRepository.persist(m);
        return Response.created(URI.create("/api/techwatch/" + m.id)).entity(m).build();
    }

    @GET
    @Path("/active")
    public Response getActive() {
        TechWatch active = techWatchRepository.find("status = ?1", TechWatchStatus.ACTIVE).firstResult();
        if (active == null) return Response.status(204).build();
        return Response.ok(active).build();
    }

    @POST
    @Path("/{id}/activate")
    @Consumes(MediaType.WILDCARD)
    @Transactional
    public TechWatch activate(@PathParam("id") Long id) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        long active = techWatchRepository.count("status = ?1", TechWatchStatus.ACTIVE);
        if (active > 0) throw new ClientErrorException("An active TechWatch already exists", 409);
        if (m.date == null) throw new BadRequestException("date is required to activate");
        m.status = TechWatchStatus.ACTIVE;
        return m;
    }

    @POST
    @Path("/{id}/complete")
    @Consumes(MediaType.WILDCARD)
    @Transactional
    public TechWatch complete(@PathParam("id") Long id) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        m.status = TechWatchStatus.COMPLETED;
        return m;
    }

    @POST
    @Path("/{id}/collect-next-links")
    @Consumes(MediaType.WILDCARD)
    @Transactional
    public Response collectNextLinks(@PathParam("id") Long id) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        if (m.status != TechWatchStatus.ACTIVE) throw new BadRequestException("TechWatch must be ACTIVE to collect links");
        List<Link> next = linkRepository.list("status = ?1", LinkStatus.NEXT_TECHWATCH);
        for (Link l : next) {
            l.techwatchId = m.id; // Attach to the TechWatch
            l.status = LinkStatus.KEEP; // attach and mark as keep for the TechWatch
        }
        return Response.ok().entity(next.size()).build();
    }
}
