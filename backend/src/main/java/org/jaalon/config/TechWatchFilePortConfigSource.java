package org.jaalon.config;

import org.eclipse.microprofile.config.spi.ConfigSource;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Custom ConfigSource that reads the HTTP port from a local Java properties file named
 * "techwatch.properties" located next to the executable (current working directory).
 *
 * Standard Java Properties format (key=value). Supported key:
 * - quarkus.http.port
 *
 * Only one property is exposed: "quarkus.http.port" when a valid value is found.
 */
public class TechWatchFilePortConfigSource implements ConfigSource {

    private static final String FILE_NAME = "techwatch.properties";
    private static final String TARGET_PROPERTY = "quarkus.http.port";

    private final Map<String, String> values;

    public TechWatchFilePortConfigSource() {
        this.values = load();
    }

    private Map<String, String> load() {
        Path file = Paths.get("").toAbsolutePath().resolve(FILE_NAME);
        String port = readPortFromProperties(file);
        if (port != null) {
            Map<String, String> out = new HashMap<>();
            out.put(TARGET_PROPERTY, port);
            return out;
        }
        return Collections.emptyMap();
    }

    private String readPortFromProperties(Path path) {
        if (path == null) return null;
        if (!Files.exists(path)) return null;
        Properties props = new Properties();
        try (InputStream in = Files.newInputStream(path);
             InputStreamReader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
            props.load(reader);
        } catch (IOException ignored) {
            return null;
        }
        String v = props.getProperty(TARGET_PROPERTY);
        if (v != null) {
            String trimmed = v.trim();
            if (isValidPort(trimmed)) {
                return trimmed;
            }
        }
        return null;
    }

    private boolean isValidPort(String s) {
        if (!s.matches("^[0-9]{1,5}$")) return false;
        try {
            int p = Integer.parseInt(s);
            return p >= 1 && p <= 65535;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @Override
    public Map<String, String> getProperties() {
        return values;
    }

    @Override
    public Set<String> getPropertyNames() {
        return new HashSet<>(values.keySet());
    }

    @Override
    public int getOrdinal() {
        // Higher than application.properties/yaml (250) to ensure override.
        return 300;
    }

    @Override
    public String getValue(String propertyName) {
        return values.get(propertyName);
    }

    @Override
    public String getName() {
        return "TechWatchFilePortConfigSource(" + FILE_NAME + ")";
    }
}
