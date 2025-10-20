package org.jaalon.links;

public enum LinkStatus {
    TO_PROCESS,    // Decide what to do with this link
    KEEP,          // Keep in the database
    LATER,         // Later
    REJECT,        // Link was rejected
    NEXT_TECHWATCH       // To include in next TechWatch
}
