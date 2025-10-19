package org.jaalon.links;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

import org.jaalon.tags.Tag;

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

    @Size(max = 8000)
    public String summary;

    // Optional Markdown content with no explicit size limit (stored as CLOB)
    @Lob
    @Column(columnDefinition = "CLOB")
    public String content;

    // Last time we updated the stored content/metadata in DB for this link
    @NotNull
    public Instant updatedAt = Instant.now();

    @NotNull
    @Enumerated(EnumType.STRING)
    public LinkStatus status = LinkStatus.TO_PROCESS;

    // Many-to-many association: a link can belong to multiple TechWatch minutes
    @ManyToMany
    @JoinTable(name = "link_techwatch",
            joinColumns = @JoinColumn(name = "link_id"),
            inverseJoinColumns = @JoinColumn(name = "techwatch_id"))
    @com.fasterxml.jackson.annotation.JsonIgnore
    public Set<org.jaalon.techwatch.TechWatch> techWatches = new HashSet<>();

    // Legacy single association column kept for backward compatibility and data migration
    // Do not use in new code paths.
    @Deprecated
    public Long techwatchId;

    @NotNull
    public Instant date = Instant.now();

    // Tags/categories associated to this link
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "link_tag",
            joinColumns = @JoinColumn(name = "link_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    public Set<Tag> tags = new LinkedHashSet<>();

    // Expose discoveredAt in JSON while keeping persisted field name as 'date'
    @JsonProperty("discoveredAt")
    public Instant getDiscoveredAt() {
        return date;
    }
}
