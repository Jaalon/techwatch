package org.jaalon.links;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
public class Link extends PanacheEntity {

    @NotBlank
    @Size(max = 250)
    public String title;

    @NotBlank
    @Size(max = 1000)
    @Column(unique = true)
    public String url;

    @Size(max = 4000)
    public String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    public LinkStatus status = LinkStatus.TO_PROCESS;

    // Optional association to a TechWatch once attached
    public Long techwatchId;

    @NotNull
    public Instant date = Instant.now();

    // Expose discoveredAt in JSON while keeping persisted field name as 'date'
    @JsonProperty("discoveredAt")
    public Instant getDiscoveredAt() {
        return date;
    }
}
