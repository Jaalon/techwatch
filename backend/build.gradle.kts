plugins {
    java
    id("io.quarkus") version "3.28.2"
}

repositories {
    mavenCentral()
    mavenLocal()
    gradlePluginPortal()
}

dependencies {
    implementation(enforcedPlatform("io.quarkus.platform:quarkus-bom:3.28.2"))
    implementation("io.quarkus:quarkus-rest")
    implementation("io.quarkus:quarkus-web-dependency-locator")
    // H2 for tests/dev only; runtime persistent store will be SQLite (see docs)
    implementation("io.quarkus:quarkus-jdbc-h2")
    implementation("io.quarkus:quarkus-undertow")
    implementation("io.quarkus:quarkus-smallrye-openapi")
    implementation("io.quarkus:quarkus-rest-jackson")
    implementation("io.quarkus:quarkus-config-yaml")
    implementation("io.quarkus:quarkus-hibernate-orm-panache")
    implementation("io.quarkus:quarkus-logging-json")
    implementation("io.quarkus:quarkus-smallrye-health")
    implementation("io.quarkus:quarkus-arc")
    implementation("io.quarkus:quarkus-hibernate-orm")
    // TODO: Add SQLite JDBC driver and dialect configuration when switching to SQLite in runtime
    // implementation("org.xerial:sqlite-jdbc:3.46.0.0")
    // TODO: Integrate ChromaDB client via HTTP for semantic search (no direct Gradle dep needed if using plain HTTP)
    testImplementation("io.quarkus:quarkus-junit5")
    testImplementation("io.rest-assured:rest-assured")
}

group = "org.jaalon"
version = "1.0.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

tasks.withType<Test> {
    systemProperty("java.util.logging.manager", "org.jboss.logmanager.LogManager")
}
tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.add("-parameters")
}
