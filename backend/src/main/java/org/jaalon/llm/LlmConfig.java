package org.jaalon.llm;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
public class LlmConfig extends PanacheEntity {

    @NotBlank
    @Size(max = 150)
    public String name;

    @NotBlank
    @Size(max = 500)
    public String baseUrl;

    @NotBlank
    @Size(max = 200)
    @JsonIgnore // do not expose apiKey in JSON responses of the entity
    public String apiKey;

    @NotBlank
    @Size(max = 200)
    public String model;

    @Column(name = "is_default")
    public boolean isDefault;

    public Instant createdAt = Instant.now();
}
