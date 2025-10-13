package org.jaalon.links;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class LinkRepository implements PanacheRepository<Link> {
}
