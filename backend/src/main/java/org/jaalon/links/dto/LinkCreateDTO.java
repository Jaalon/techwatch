package org.jaalon.links.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LinkCreateDTO {
    @NotBlank
    @Size(max = 250)
    public String title;

    @NotBlank
    @Size(max = 1000)
    public String url;

    @Size(max = 4000)
    public String description;
}
