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
    description = "Build frontend, copy assets into backend, and produce Quarkus native image including static resources"
    dependsOn(":frontend:build", ":backend:copyFrontend")
    doLast {
        val isWindows = System.getProperty("os.name").lowercase().contains("windows")
        if (isWindows) {
            exec {
                workingDir = rootDir
                commandLine("cmd", "/c", "gradlew.bat", ":backend:quarkusBuild", "-Dquarkus.package.type=native")
            }
        } else {
            exec {
                workingDir = rootDir
                commandLine("./gradlew", ":backend:quarkusBuild", "-Dquarkus.package.type=native")
            }
        }
    }
}
