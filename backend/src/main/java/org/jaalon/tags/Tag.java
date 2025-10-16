package org.jaalon.tags;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "tag")
public class Tag extends PanacheEntity {

    @NotBlank
    @Size(max = 100)
    @Column(unique = true, nullable = false, length = 100)
    public String name;
}
