package org.jaalon.api;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/api/config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConfigResource {
    
    @ConfigProperty(name = "quarkus.http.port")
    int serverPort;
    
    @GET
    @Path("/port")
    public int getPort() {
        return serverPort;
    }
}