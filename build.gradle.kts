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


// --- Packaging tasks appended by Junie ---

// Downloads the latest WinSW x64 executable into build/package
val downloadWinSW by tasks.registering {
    group = "package"
    description = "Download latest WinSW x64 executable"
    val targetDir = layout.buildDirectory.dir("package")
    outputs.file(targetDir.map { it.file("WinSW-x64.exe") })
    doLast {
        val url = java.net.URL("https://github.com/winsw/winsw/releases/latest/download/WinSW-x64.exe")
        val outDir = targetDir.get().asFile
        if (!outDir.exists()) outDir.mkdirs()
        val outFile = targetDir.get().file("WinSW-x64.exe").asFile
        url.openStream().use { input ->
            java.nio.file.Files.copy(
                input,
                outFile.toPath(),
                java.nio.file.StandardCopyOption.REPLACE_EXISTING
            )
        }
        println("Downloaded WinSW to: ${outFile.absolutePath}")
    }
}

// Packages the application distribution zip
tasks.register<Zip>("package") {
    group = "package"
    description = "Runs prodBuild, downloads WinSW and creates techwatch-<version>.zip with required files"

    dependsOn("prodBuild", downloadWinSW)

    // Output archive name and location
    val ver = project.version.toString()
    archiveFileName.set("techwatch-${ver}.zip")
    destinationDirectory.set(layout.buildDirectory.dir("distributions"))

    // Paths
    val backendModule = project(":backend")
    val backendBuildDirProvider = backendModule.layout.buildDirectory
    val backendRunner = backendBuildDirProvider.file("${backendModule.name}-${ver}-runner.exe")

    // Include backend runner renamed to techwatch.exe
    from(backendRunner) {
        rename { "techwatch.exe" }
        into("")
    }

    // Include downloaded WinSW executable
    from(layout.buildDirectory.file("package/WinSW-x64.exe")) {
        into("")
    }

    // Include content of src/main/resources/package
    from("src/main/resources/package") {
        into("")
    }

    // Include browser extension build output under browser-extension/
    val beDistDir = file("browser-extension/dist")
    if (beDistDir.exists()) {
        from(beDistDir) {
            into("browser-extension")
        }
    } else {
        logger.warn("browser-extension/dist not found. It will not be included in the package.")
    }

    doFirst {
        val runnerFile = backendRunner.get().asFile
        if (!runnerFile.exists()) {
            throw GradleException("Backend native runner not found: ${runnerFile.absolutePath}. Run prodBuild first.")
        }
    }
}
