package org.jaalon.apikey;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Stores reusable provider API credentials independent from model configurations.
 */
@Entity
public class AiApiKey extends PanacheEntity {

    @NotBlank
    @Size(max = 50)
    public String provider; // perplexity | openai | mistral

    @NotBlank
    @Size(max = 150)
    public String name; // user friendly name

    @NotBlank
    @Size(max = 500)
    public String baseUrl;

    @NotBlank
    @Size(max = 200)
    @JsonIgnore // never serialize raw secret
    public String apiKey;

    @Size(max = 100)
    public String organizationId; // openai optional

    @Size(max = 100)
    public String projectId; // openai optional

    @Column(nullable = false)
    public Instant createdAt = Instant.now();
}
