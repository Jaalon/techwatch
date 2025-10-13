package org.jaalon.links.dto;

import jakarta.validation.constraints.Size;
import org.jaalon.links.LinkStatus;

public class LinkUpdateDTO {
    @Size(max = 250)
    public String title;

    @Size(max = 1000)
    public String url;

    @Size(max = 4000)
    public String description;

    public LinkStatus status;
}
