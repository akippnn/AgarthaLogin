import org.cadixdev.gradle.licenser.LicenseProperties

plugins {
    id("org.cadixdev.licenser") version "0.6.1"
    id("com.diffplug.spotless") version "8.1.0"
}

defaultTasks("updateLicenses", "shadowJar")

version = "0.51"
if (project.hasProperty("prodVersion")) {
    version = project.property("prodVersion").toString()
}

subprojects {
    version = rootProject.version
    group = "xyz.kyngs.librelogin"

    configurations.all {
        resolutionStrategy {
            force("org.codehaus.plexus:plexus-utils:3.6.1")
        }
    }

    apply {
        plugin("org.cadixdev.licenser")
        plugin("com.diffplug.spotless")
    }

    tasks.configureEach {
        if (name.contains("jar", true)) {
            dependsOn("updateLicenses")
            dependsOn("spotlessJavaApply")
        }
    }

    repositories {
        mavenLocal()
        mavenCentral()
        maven {
            url = uri("https://jitpack.io")
        }
    }

    license {
        header(rootProject.file("HEADER.txt"))
        include("**/*.java")
        newLine(true)

        matching("", closureOf<LicenseProperties> {
            header.set(rootProject.resources.text.fromFile("licenses/FASTLOGIN_LICENSE"))
        });
    }

    spotless {
        java {
            googleJavaFormat()
                .aosp()
                .reflowLongStrings()
                .reorderImports(false)
        }
    }
}

tasks.register("generateLocales") {
    group = "build"
    description = "Generates HOCON and JSON locale files from PO sources"

    val localesDir = file("locales")
    val pluginResourcesDir = file("Plugin/src/main/resources/locales")
    val frontendPublicDir = file("frontend/public/locales")

    inputs.dir(localesDir)
    outputs.dir(pluginResourcesDir)
    outputs.dir(frontendPublicDir)

    doLast {
        if (!localesDir.exists()) return@doLast

        pluginResourcesDir.mkdirs()
        frontendPublicDir.mkdirs()

        localesDir.listFiles()?.filter { it.extension == "po" }?.forEach { poFile ->
            val lang = poFile.nameWithoutExtension
            val entries = mutableMapOf<String, String>()
            
            var currentMsgId = ""
            var currentMsgStr = ""
            var inMsgId = false
            var inMsgStr = false

            poFile.readLines().forEach { line ->
                val trimmed = line.trim()
                // Unescape logic: simple replacement for common PO escapes
                fun unescapePo(s: String): String {
                    return s.replace("\\\"", "\"")
                            .replace("\\n", "\n")
                            .replace("\\\\", "\\")
                }

                if (trimmed.startsWith("msgid ")) {
                    if (currentMsgId.isNotEmpty() && currentMsgStr.isNotEmpty()) {
                        entries[currentMsgId] = currentMsgStr
                    }
                    currentMsgId = unescapePo(trimmed.removePrefix("msgid ").trim('"'))
                    currentMsgStr = ""
                    inMsgId = true
                    inMsgStr = false
                } else if (trimmed.startsWith("msgstr ")) {
                    inMsgStr = true
                    inMsgId = false
                    currentMsgStr = unescapePo(trimmed.removePrefix("msgstr ").trim('"'))
                } else if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
                    val content = unescapePo(trimmed.trim('"'))
                    if (inMsgId) currentMsgId += content
                    if (inMsgStr) currentMsgStr += content
                }
            }
            // Add last entry
            if (currentMsgId.isNotEmpty() && currentMsgStr.isNotEmpty()) {
                entries[currentMsgId] = currentMsgStr
            }

            // removing header entry if present (usually msgid "")
            entries.remove("")

            // Helper to escape string for HOCON/JSON
            fun escape(s: String): String {
                return s.replace("\\", "\\\\").replace("\"", "\\\"")
            }

            // Generate HOCON
            val hoconFile = File(pluginResourcesDir, "messages_${lang}.conf")
            hoconFile.writeText(entries.entries.joinToString("\n") { (k, v) -> 
                 "\"${escape(k)}\": \"${escape(v)}\"" 
            })

            // Generate JSON
            val jsonFile = File(frontendPublicDir, "${lang}.json")
            val jsonContent = entries.entries.joinToString(",\n  ", "{\n  ", "\n}") { (k, v) ->
                "\"${escape(k)}\": \"${escape(v)}\""
            }
            jsonFile.writeText(jsonContent)
            
            println("Generated locale $lang: ${entries.size} keys")
        }

        // Generate index
        val indexFile = File(pluginResourcesDir, "available_locales.txt")
        val available = localesDir.listFiles()?.filter { it.extension == "po" }?.map { it.nameWithoutExtension } ?: emptyList()
        indexFile.writeText(available.joinToString("\n"))
    }
}

// Task moved to subprojects block
