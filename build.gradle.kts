plugins {
    //id("io.quarkus") version "3.18.3" apply false
}

allprojects {
    group = "org.jaalon"
    version = "1.0.0-SNAPSHOT"
}

tasks.register("buildAll") {
    dependsOn(":backend:build", ":frontend:build", ":browser-extension:build")
    group = "build"
    description = "Build all modules (backend, frontend, extension)"
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


tasks.register("dev") {
    dependsOn(":backend:quarkusDev", ":frontend:dev", ":browser-extension:dev")
}

tasks.register("prodBuild") {
    group = "build"
    dependsOn(":backend:fullNativeBuild")
}
