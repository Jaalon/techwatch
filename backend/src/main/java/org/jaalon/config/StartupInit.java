package org.jaalon.config;

import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.File;

@Startup
@ApplicationScoped
public class StartupInit {
    public StartupInit() {
        // Ensure data directory exists for the embedded database
        File dir = new File("./var");
        if (!dir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
        }
    }
}
