package org.jaalon.exchange.exporters;

import org.jaalon.exchange.DataExchangeFiles;
import org.jaalon.exchange.ExportType;

public interface DataExporter {
    DataExchangeFiles file();

    Object exportData();

    ExportType dataType();
}
