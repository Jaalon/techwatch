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
    // H2 database (file mode)
    implementation("io.quarkus:quarkus-jdbc-h2")
    implementation("io.quarkus:quarkus-undertow")
    implementation("io.quarkus:quarkus-smallrye-openapi")
    implementation("io.quarkus:quarkus-rest-jackson")
    implementation("io.quarkus:quarkus-config-yaml")
    implementation("io.quarkus:quarkus-hibernate-orm-panache")
    implementation("io.quarkus:quarkus-hibernate-validator")
    implementation("io.quarkus:quarkus-logging-json")
    implementation("io.quarkus:quarkus-smallrye-health")
    implementation("io.quarkus:quarkus-arc")
    implementation("io.quarkus:quarkus-hibernate-orm")
    implementation("io.quarkus:quarkus-liquibase")
    implementation("io.quarkiverse.langchain4j:quarkus-langchain4j-openai:1.3.1")
    testImplementation("io.quarkus:quarkus-junit5")
    testImplementation("io.quarkus:quarkus-junit5-mockito")
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

tasks.register<Copy>("copyFrontend") {
    dependsOn(":frontend:build")
    from(project(":frontend").layout.buildDirectory.dir("dist"))
    into(layout.buildDirectory.dir("resources/main/META-INF/resources"))
}

tasks.named("processResources") {
    dependsOn("copyFrontend")
}

tasks.register<Exec>("setNativeProperties") {
    System.setProperty("quarkus.native.enabled", "true")
    System.setProperty("quarkus.package.jar.enabled", "false")
}

tasks.register<Exec>("fullNativeBuild") {
    dependsOn("copyFrontend", "setNativeProperties", "quarkusBuild")
    group = "build"
    description = "Build native executable with embedded frontend"
}
