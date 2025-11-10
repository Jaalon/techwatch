package org.jaalon.apikey;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AiApiKeyRepository implements PanacheRepository<AiApiKey> {
}
