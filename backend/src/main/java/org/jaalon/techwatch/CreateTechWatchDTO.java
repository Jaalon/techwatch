package org.jaalon.techwatch;

import java.time.LocalDate;

public record CreateTechWatchDTO (LocalDate date,
                                  TechWatchStatus status,
                                  Integer maxArticles) {
}
