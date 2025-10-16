package org.jaalon.api;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jaalon.config.PromptInstruction;
import org.jaalon.config.PromptInstructionRepository;

@Path("/api/instructions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PromptInstructionResource {

    public static final String TYPE_SUMMARIZE = "summarize";

    public static class InstructionDTO {
        public String type;
        public String content;
        public static InstructionDTO from(PromptInstruction pi) {
            InstructionDTO dto = new InstructionDTO();
            dto.type = pi.type;
            dto.content = pi.content;
            return dto;
        }
    }

    @Inject
    PromptInstructionRepository repository;

    @GET
    @Path("/summarize")
    public InstructionDTO getSummarize() {
        PromptInstruction pi = repository.findById(TYPE_SUMMARIZE);
        if (pi == null) {
            throw new NotFoundException();
        }
        return InstructionDTO.from(pi);
    }

    @PUT
    @Path("/summarize")
    @Transactional
    public InstructionDTO saveSummarize(InstructionDTO dto) {
        if (dto == null || dto.content == null) throw new BadRequestException("content is required");
        PromptInstruction pi = repository.findById(TYPE_SUMMARIZE);
        if (pi == null) {
            pi = new PromptInstruction();
            pi.type = TYPE_SUMMARIZE;
            pi.content = dto.content;
            repository.persist(pi);
        } else {
            pi.content = dto.content;
        }
        return InstructionDTO.from(pi);
    }
}
