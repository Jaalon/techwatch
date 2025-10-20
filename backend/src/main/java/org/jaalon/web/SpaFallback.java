package org.jaalon.web;

import io.quarkus.vertx.http.runtime.filters.Filters;
import io.vertx.core.http.HttpMethod;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

/**
 * SPA fallback: reroute unknown non-API GET paths to index.html so React Router can handle them.
 * Excludes Quarkus non-application endpoints (/q) and static assets that contain a dot.
 */
@ApplicationScoped
public class SpaFallback {

    public void register(@Observes Filters filters) {
        filters.register(rc -> {
            if (rc.request().method() == HttpMethod.GET) {
                String path = rc.normalisedPath();
                // Exclude API and Quarkus internal endpoints
                if (!path.startsWith("/api") && !path.startsWith("/q")) {
                    // If path has no file extension and is not root, let SPA handle it
                    if (!"/".equals(path) && !path.contains(".")) {
                        rc.reroute("/index.html");
                        return;
                    }
                }
            }
            rc.next();
        }, 100);
    }
}
