plugins {
    base
}

val npmCmd = if (System.getProperty("os.name").lowercase().contains("win")) "npm.cmd" else "npm"

val npmInstall = tasks.register<Exec>("npmInstall") {
    group = "build"
    description = "Install npm dependencies"
    commandLine(npmCmd, "install")
    workingDir = projectDir
    inputs.file(project.file("package.json"))
    inputs.file(project.file("package-lock.json"))
    outputs.dir(project.file("node_modules"))
    onlyIf { project.file("package.json").exists() }
}

val buildFront = tasks.register<Exec>("buildFront") {
    dependsOn(npmInstall)
    group = "build"
    description = "Build browser extension for production"
    commandLine(npmCmd, "run", "build")
    workingDir = projectDir
    inputs.file(project.file("package.json"))
    inputs.file(project.file("package-lock.json"))
    outputs.dir(project.file("node_modules"))
    onlyIf { project.file("package.json").exists() }
}

val watch = tasks.register<Exec>("watch") {
    dependsOn(npmInstall)
    group = "development"
    description = "Build browser extension in watch mode"
    commandLine(npmCmd, "run", "watch")
    workingDir = projectDir
    inputs.file(project.file("package.json"))
    inputs.file(project.file("package-lock.json"))
    outputs.dir(project.file("node_modules"))
    onlyIf { project.file("package.json").exists() }
}

tasks.named("clean") {
    doLast {
        delete("dist", "node_modules")
    }
}

tasks.named("assemble") {
    dependsOn(buildFront)
}
