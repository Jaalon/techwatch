package org.jaalon.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Singleton;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Creates a default techwatch.properties file on first startup if it doesn't exist.
 *
 * Location: current working directory, same as used by {@link TechWatchFilePortConfigSource}.
 * Content: standard Java Properties with key "quarkus.http.port" set to the effective port value.
 */
@Singleton
public class TechWatchPortFileInitializer {

    private static final Logger LOG = Logger.getLogger(TechWatchPortFileInitializer.class);
    private static final String FILE_NAME = "techwatch.properties";

    @ConfigProperty(name = "quarkus.http.port", defaultValue = "8080")
    int serverPort;

    void onStart(@Observes StartupEvent ev) {
        try {
            Path target = Paths.get("").toAbsolutePath().resolve(FILE_NAME);
            if (Files.exists(target)) {
                // Nothing to do. Respect existing file which may define a custom port.
                return;
            }

            // Prepare minimal properties containing the effective port.
            Properties props = new Properties();
            props.setProperty("quarkus.http.port", String.valueOf(serverPort));

            // Ensure parent directory exists (normally it does for CWD).
            Path parent = target.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            try (OutputStream os = Files.newOutputStream(target);
                 Writer writer = new OutputStreamWriter(os, StandardCharsets.UTF_8)) {
                props.store(writer, "TechWatch – auto-created on first start. Edit to change HTTP port.");
            }
            LOG.infov("Created {0} with quarkus.http.port={1}", target.getFileName().toString(), serverPort);
        } catch (IOException e) {
            // If we fail to create the file (permissions, RO FS, etc.), just log and continue.
            LOG.warn("Failed to create techwatch.properties on startup: " + e.getMessage());
        } catch (Exception e) {
            LOG.warn("Unexpected error while initializing techwatch.properties: " + e.getMessage());
        }
    }
}
