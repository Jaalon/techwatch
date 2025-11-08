package org.jaalon.techwatch;

import java.time.LocalDate;

public record UpdateTechWatchDTO(
        TechWatchStatus status,
        Integer maxArticles,
        LocalDate date
) {}
