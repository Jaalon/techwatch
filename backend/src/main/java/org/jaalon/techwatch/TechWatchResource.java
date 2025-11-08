package org.jaalon.techwatch;

import io.quarkus.panache.common.Sort;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jaalon.links.Link;

import java.net.URI;
import java.util.List;

@Path("/api/techwatch")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TechWatchResource {

    @Inject
    TechWatchRepository techWatchRepository;

    @Inject
    TechWatchService techWatchService;

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

    @POST
    @Transactional
    public Response create(@Valid CreateTechWatchDTO dto) {
        if (dto == null || dto.date() == null) {
            throw new BadRequestException("date is required");
        }
        TechWatch m = new TechWatch();
        m.date = dto.date();
        m.status = dto.status() != null ? dto.status() : TechWatchStatus.PLANNED;
        m.maxArticles = (dto.maxArticles() != null && dto.maxArticles() > 0) ? dto.maxArticles() : 10;

        long activeCount = techWatchRepository.count("status = ?1", TechWatchStatus.ACTIVE);
        // If client asks ACTIVE but one already exists -> 409
        if (m.status == TechWatchStatus.ACTIVE && activeCount > 0) {
            throw new ClientErrorException("An active TechWatch already exists", 409);
        }
        // Auto-activation rules
        // - If no TechWatch is ACTIVE, the newly created becomes ACTIVE regardless of requested status
        if (activeCount == 0) {
            m.status = TechWatchStatus.ACTIVE;
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
        promoteNextOrCreate(m);
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
        int assigned = techWatchService.distributeNextLinks();
        return Response.ok().entity(assigned).build();
    }

    @GET
    @Path("/{id}/links")
    public List<Link> listLinks(@PathParam("id") Long id) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        return techWatchService.listLinks(id);
    }

    @DELETE
    @Path("/{id}/links/{linkId}")
    @Transactional
    public Response removeLink(@PathParam("id") Long id, @PathParam("linkId") Long linkId) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        techWatchService.removeLinkFromTechWatch(id, linkId);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public TechWatch update(@PathParam("id") Long id, UpdateTechWatchDTO dto) {
        TechWatch m = techWatchRepository.findById(id);
        if (m == null) throw new NotFoundException();
        if (dto == null) return m;

        TechWatchStatus prevStatus = m.status;

        // Handle date change with uniqueness check
        if (dto.date() != null && !dto.date().equals(m.date)) {
            TechWatch existing = techWatchRepository.find("date = ?1", dto.date()).firstResult();
            if (existing != null && !existing.id.equals(m.id)) {
                throw new ClientErrorException("A TechWatch already exists for the selected date", 409);
            }
            m.date = dto.date();
        }

        if (dto.maxArticles() != null) {
            if (dto.maxArticles() <= 0) throw new BadRequestException("maxArticles must be > 0");
            m.maxArticles = dto.maxArticles();
        }
        if (dto.status() != null) {
            TechWatchStatus newStatus = dto.status();
            if (newStatus == TechWatchStatus.ACTIVE) {
                if (m.date == null) throw new BadRequestException("date is required to activate");
                TechWatch currentActive = techWatchRepository.find("status = ?1", TechWatchStatus.ACTIVE).firstResult();
                if (currentActive != null && !currentActive.id.equals(m.id)) {
                    // Demote the previously ACTIVE to PLANNED
                    currentActive.status = TechWatchStatus.PLANNED;
                }
                m.status = TechWatchStatus.ACTIVE;
            } else {
                m.status = newStatus;
            }
        }

        // Business rule: when an ACTIVE TechWatch is changed to a non-ACTIVE status,
        // the next one by date becomes ACTIVE; if none exists, create one at +7 days.
        if (prevStatus == TechWatchStatus.ACTIVE && m.status != TechWatchStatus.ACTIVE) {
            promoteNextOrCreate(m);
        }
        return m;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        TechWatch reference = techWatchRepository.findById(id);
        if (reference == null) throw new NotFoundException();
        boolean wasActive = reference.status == TechWatchStatus.ACTIVE;
        // Keep reference data (date) before deletion for creation logic
        techWatchRepository.delete(reference);
        if (wasActive) {
            promoteNextOrCreate(reference);
        }
        return Response.noContent().build();
    }

    private void promoteNextOrCreate(TechWatch reference) {
        // Promote the next PLANNED with a later date to ACTIVE, otherwise create a new one at +7 days
        TechWatch next = techWatchRepository
                .find("status = ?1 and date > ?2 order by date", TechWatchStatus.PLANNED, reference.date)
                .firstResult();
        if (next != null) {
            next.status = TechWatchStatus.ACTIVE;
        } else {
            TechWatch created = new TechWatch();
            created.date = reference.date != null ? reference.date.plusDays(7) : java.time.LocalDate.now().plusDays(7);
            created.status = TechWatchStatus.ACTIVE;
            created.maxArticles = 10;
            techWatchRepository.persist(created);
        }
    }
}
