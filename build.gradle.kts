plugins {
    //id("io.quarkus") version "3.18.3" apply false
}

allprojects {
    group = "org.jaalon"
    version = "1.0.0-SNAPSHOT"
}

tasks.register("devAll") {
    group = "development"
    description = "Start all modules in development mode"
    doLast {
        println("To run in development mode, open 3 terminals and run:")
        println("  Terminal 1: ./gradlew :backend:quarkusDev")
        println("  Terminal 2: ./gradlew :frontend:dev")
        println("  Terminal 3: ./gradlew :browser-extension:dev")
    }
}

tasks.register("prodBuild") {
    group = "build"
    description = "Build frontend, copy assets into backend, and produce Quarkus native image including static resources"
    dependsOn(":frontend:build", ":backend:copyFrontend", "backend:quarkusBuild")
}
