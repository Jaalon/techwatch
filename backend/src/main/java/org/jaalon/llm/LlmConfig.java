package org.jaalon.llm;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jaalon.apikey.AiApiKey;

import java.time.Instant;

@Entity
public class LlmConfig extends PanacheEntity {

    @NotBlank
    @Size(max = 150)
    public String name;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "ai_api_key_id", nullable = false)
    public AiApiKey aiApiKey;

    @NotBlank
    @Size(max = 200)
    public String model;

    @Column(name = "is_default")
    public boolean isDefault;

    public Instant createdAt = Instant.now();
}
