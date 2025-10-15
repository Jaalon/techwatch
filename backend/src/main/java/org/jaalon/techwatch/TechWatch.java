package org.jaalon.techwatch;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
public class TechWatch extends PanacheEntity {

    @NotNull
    public LocalDate date; // Scheduled or actual date, provided by user

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    public TechWatchStatus status = TechWatchStatus.PLANNED;

    @NotNull
    @Column(name = "maxArticles")
    public Integer maxArticles = 10; // Capacity per TechWatch, default 10
}
