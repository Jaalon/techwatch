plugins {
    base
}

val npmCmd = if (System.getProperty("os.name").lowercase().contains("win")) "npm.cmd" else "npm"

val npmInstall = tasks.register<Exec>("npmInstall") {
    group = "build"
    description = "Install npm dependencies"
    commandLine(npmCmd, "install")
    workingDir = projectDir
    inputs.dir(project.file("src"))
    inputs.file(project.file("package.json"))
    outputs.dir(project.file("dist"))
    onlyIf { project.file("package.json").exists() }
}

val buildExtensions = tasks.register<Exec>("buildExtensions") {
    dependsOn(npmInstall)
    group = "build"
    description = "Build frontend for production"
    commandLine(npmCmd, "run", "build")
    workingDir = projectDir
    inputs.dir(project.file("src"))
    inputs.file(project.file("package.json"))
    outputs.dir(project.file("dist"))
    onlyIf { project.file("package.json").exists() }
}

val dev = tasks.register<Exec>("dev") {
    dependsOn(npmInstall)
    group = "development"
    description = "Start frontend in development mode"
    commandLine(npmCmd, "run", "dev")
    workingDir = projectDir
    inputs.dir(project.file("src"))
    inputs.file(project.file("package.json"))
    outputs.dir(project.file("dist"))
    onlyIf { project.file("package.json").exists() }
}

tasks.named("clean") {
    doLast {
        delete("dist", "node_modules")
    }
}

tasks.named("assemble") {
    dependsOn(buildExtensions)
}
