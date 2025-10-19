package org.jaalon.links.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class LinkUpsertContentDTO {
    @NotBlank
    @Size(max = 1000)
    public String url;

    @Size(max = 250)
    public String title;

    @Size(max = 4000)
    public String description;

    // Markdown content extracted from the page
    public String content;

    // Last-Modified time of the remote resource, if known
    public Instant lastModified;

    // Optional hint from client to indicate this is non-textual (video, etc.)
    public Boolean nonTextual;
}
