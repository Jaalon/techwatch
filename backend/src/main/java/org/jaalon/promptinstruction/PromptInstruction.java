package org.jaalon.promptinstruction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "prompt_instruction")
public class PromptInstruction {

    @Id
    @Column(name = "type", length = 100, nullable = false)
    public String type;

    @Column(name = "content", length = 4000, nullable = false)
    public String content;
}
