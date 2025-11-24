package org.jaalon.exchange;

import jakarta.ws.rs.BadRequestException;

/**
 * Type d'export supporté par DataExportService.
 */
public enum ExportType {
    TECHNICAL,
    FUNCTIONAL;

    public static ExportType fromString(String type) {
        if (type == null) {
            throw new BadRequestException("type must be 'technical' or 'functional'");
        }
        String t = type.trim().toLowerCase();
        return switch (t) {
            case "technical" -> TECHNICAL;
            case "functional" -> FUNCTIONAL;
            default -> throw new BadRequestException("type must be 'technical' or 'functional'");
        };
    }
}
