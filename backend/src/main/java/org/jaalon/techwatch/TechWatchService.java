package org.jaalon.techwatch;

import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.jaalon.links.Link;
import org.jaalon.links.LinkRepository;
import org.jaalon.links.LinkStatus;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class TechWatchService {

    @Inject
    TechWatchRepository techWatchRepository;

    @Inject
    LinkRepository linkRepository;

    public long countLinks(long techwatchId) {
        var em = linkRepository.getEntityManager();
        Long count = em.createQuery(
                "select count(l) from Link l join l.techWatches t where t.id = :twId", Long.class)
                .setParameter("twId", techwatchId)
                .getSingleResult();
        return count != null ? count : 0L;
    }

    public List<Link> listLinks(long techwatchId) {
        var em = linkRepository.getEntityManager();
        return em.createQuery(
                        "select l from Link l join l.techWatches t where t.id = :twId order by l.date desc",
                        Link.class)
                .setParameter("twId", techwatchId)
                .getResultList();
    }

    /**
     * Remove association of a link from a given TechWatch without deleting the link.
     */
    @Transactional
    public void removeLinkFromTechWatch(long techwatchId, long linkId) {
        Link link = linkRepository.findById(linkId);
        if (link == null) throw new NotFoundException();
        org.jaalon.techwatch.TechWatch tw = techWatchRepository.findById(techwatchId);
        if (tw == null) throw new NotFoundException();
        boolean removed = link.techWatches.remove(tw);
        if (!removed) {
            throw new NotFoundException();
        }
        // Update legacy field if it pointed to this TW; set to another associated TW if any, else null
        if (link.techwatchId != null && link.techwatchId.equals(tw.id)) {
            Long replacement = link.techWatches.stream().findFirst().map(t -> t.id).orElse(null);
            link.techwatchId = replacement;
        }
        // Do not change link.status automatically.
    }

    /**
     * Finds the earliest by date TechWatch (ACTIVE or PLANNED) that still has capacity.
     * If none exists, creates one dated +7 days after the latest PLANNED (or ACTIVE if none PLANNED) and returns it.
     */
    @Transactional
    public TechWatch findOrCreateNextAvailable() {
        List<TechWatch> all = techWatchRepository.listAll(Sort.by("date").ascending());
        // Prefer ACTIVE/PLANNED only
        all.removeIf(tw -> tw.status == TechWatchStatus.COMPLETED);
        for (TechWatch tw : all) {
            if (countLinks(tw.id) < tw.maxArticles) {
                return tw;
            }
        }
        // None has capacity or none exists: create new +7 days after latest date
        Optional<LocalDate> latest = all.stream().map(t -> t.date).max(Comparator.naturalOrder());
        LocalDate base = latest.orElse(LocalDate.now());
        TechWatch created = new TechWatch();
        created.date = base.plusDays(7);
        created.status = TechWatchStatus.PLANNED;
        created.maxArticles = 10; // default
        techWatchRepository.persist(created);
        return created;
    }

    /** Assign a single link to the next available TechWatch with capacity. */
    @Transactional
    public TechWatch assignLinkToNext(long linkId) {
        Link link = linkRepository.findById(linkId);
        if (link == null) throw new NotFoundException();
        if (link.status == LinkStatus.REJECT) throw new BadRequestException("Cannot assign a rejected link");
        TechWatch target = findOrCreateNextAvailable();
        // Add association without removing previous ones
        if (!link.techWatches.contains(target)) {
            link.techWatches.add(target);
        }
        // Maintain legacy field for backward compatibility (last assigned)
        link.techwatchId = target.id;
        // Consider KEEP when assigned to any TechWatch
        if (link.status == LinkStatus.NEXT_TECHWATCH || link.status == LinkStatus.TO_PROCESS) {
            link.status = LinkStatus.KEEP;
        }
        return target;
    }

    /**
     * Distribute all NEXT_TECHWATCH links across TechWatches by date, respecting capacity, spillover creating new dates if needed.
     * Returns the number of links assigned.
     */
    @Transactional
    public int distributeNextLinks() {
        List<Link> next = linkRepository.list("status = ?1", LinkStatus.NEXT_TECHWATCH);
        int assigned = 0;
        for (Link l : next) {
            TechWatch target = findOrCreateNextAvailable();
            if (!l.techWatches.contains(target)) {
                l.techWatches.add(target);
                assigned++;
            }
            // Maintain legacy field for backward compatibility (last assigned)
            l.techwatchId = target.id;
            if (l.status == LinkStatus.NEXT_TECHWATCH || l.status == LinkStatus.TO_PROCESS) {
                l.status = LinkStatus.KEEP;
            }
        }
        return assigned;
    }
}
