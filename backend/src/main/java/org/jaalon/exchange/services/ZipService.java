package org.jaalon.exchange.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class ZipService {

    @Inject ObjectMapper mapper;

    public void writeJsonEntry(ZipOutputStream zipOutputStream, String name, Object value) throws IOException {
        byte[] bytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(value);
        ZipEntry entry = new ZipEntry(name);
        zipOutputStream.putNextEntry(entry);
        zipOutputStream.write(bytes);
        zipOutputStream.closeEntry();
    }

    public Map<String, byte[]> readZipToMap(InputStream in) {
        try (ZipInputStream zis = new ZipInputStream(in)) {
            Map<String, byte[]> map = new HashMap<>();
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) {
                ByteArrayOutputStream bout = new ByteArrayOutputStream();
                zis.transferTo(bout);
                map.put(e.getName(), bout.toByteArray());
            }
            return map;
        } catch (IOException e) {
            throw new BadRequestException("Invalid ZIP", e);
        }
    }

    public <T> T readIfPresent(Map<String, byte[]> files, String name, TypeReference<T> typeRef) {
        byte[] data = files.get(name);
        if (data == null) return null;
        try {
            return mapper.readValue(data, typeRef);
        } catch (IOException e) {
            throw new BadRequestException("Invalid JSON in " + name, e);
        }
    }
}
