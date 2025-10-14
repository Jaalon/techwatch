package org.jaalon.techwatch;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TechWatchRepository implements PanacheRepository<TechWatch> {
}
