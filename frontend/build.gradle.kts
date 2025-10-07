plugins {
    base
}

val npmCmd = if (System.getProperty("os.name").lowercase().contains("win")) "npm.cmd" else "npm"

tasks.register<Exec>("frontendNpmCi") {
    workingDir = project.projectDir
    commandLine(npmCmd, "ci")
    inputs.file(project.file("package.json"))
    inputs.file(project.file("package-lock.json"))
    outputs.dir(project.file("node_modules"))
    onlyIf { project.file("package.json").exists() }
}

tasks.register<Exec>("frontendBuild") {
    dependsOn("frontendNpmCi")
    workingDir = project.projectDir
    commandLine(npmCmd, "run", "build")
    inputs.dir(project.file("src"))
    inputs.file(project.file("package.json"))
    outputs.dir(project.file("dist"))
    onlyIf { project.file("package.json").exists() }
}

tasks.register<Exec>("frontendDev") {
    dependsOn("frontendNpmCi")
    workingDir = project.projectDir
    commandLine(npmCmd, "run", "dev")
}
