plugins {
}

tasks.register("dev") {
    dependsOn(":backend:quarkusDev", ":frontend:frontendDev", ":browser-extension:frontendDev")
}

tasks.register("prodBuild") {
    group = "build"
    dependsOn(":backend:quarkusBuild")
}
