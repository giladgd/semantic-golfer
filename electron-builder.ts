import {copyFile} from "node:fs/promises";
import path from "node:path";
import type {Configuration} from "electron-builder";

const appId = "com.giladgd.semantic-golfer";
const productName = "Semantic Golfer";

/**
 * @see - https://www.electron.build/configuration/configuration
 */
export default {
    appId: appId,
    asar: true,
    productName: productName,
    icon: "assets/icon.png",
    artifactName: "Semantic-Golfer-${version}-${os}-${arch}.${ext}",
    // Builder embeds the updater configuration; semantic-release remains the only publisher.
    publish: {provider: "generic", url: "https://github.com/giladgd/semantic-golfer/releases/latest/download/"},
    forceCodeSigning: false,
    directories: {
        output: "release"
    },

    files: [
        "dist",
        "dist-electron",
        "LICENSE",
        "!node_modules/node-llama-cpp/bins/**/*",
        "node_modules/node-llama-cpp/bins/${os}-${arch}*/**/*",
        "!node_modules/node-llama-cpp/llama/localBuilds/**/*",
        "node_modules/node-llama-cpp/llama/localBuilds/${os}-${arch}*/**/*",
        "!node_modules/@node-llama-cpp/*/bins/**/*",
        "node_modules/@node-llama-cpp/${os}-${arch}*/bins/**/*"
    ],
    asarUnpack: [
        "node_modules/node-llama-cpp/bins",
        "node_modules/node-llama-cpp/llama/localBuilds",
        "node_modules/@node-llama-cpp/*"
    ],
    afterPack: async ({electronPlatformName, appOutDir, packager}) => {
        if (electronPlatformName === "darwin") {
            // Older macOS versions use the dark ICNS; newer versions use Icon Composer's appearances.
            await copyFile(path.join(packager.projectDir, "assets/icon.icns"), path.join(packager.getResourcesDir(appOutDir), "icon.icns"));
        }
    },
    mac: {
        icon: "build/SemanticGolfer.icon",
        category: "public.app-category.productivity",
        // Ad-hoc signing supports Apple Silicon; releases have no Developer ID signature or notarization.
        identity: "-",
        notarize: false,
        target: [{
            target: "dmg",
            arch: [
                "arm64",
                "x64"
            ]
        }, {
            target: "zip",
            arch: [
                "arm64",
                "x64"
            ]
        }]
    },
    win: {
        icon: "assets/icon.ico",
        target: [{
            target: "nsis",
            arch: [
                "x64",
                "arm64"
            ]
        }]
    },
    nsis: {
        oneClick: true,
        perMachine: false,
        allowToChangeInstallationDirectory: false,
        deleteAppDataOnUninstall: false
    },
    snapcraft: {
        // Use the modern GNOME runtime in an isolated Ubuntu 24.04 build environment.
        base: "core24",
        core24: {
            useLXD: true,
            stagePackages: ["default", "libstdc++6"],
            plugs: ["home", "network", {"browser-support": {interface: "browser-support", "allow-sandbox": true}}]
        }
    },
    linux: {
        executableName: "semantic-golfer",
        // A directory, so the builder resizes its icon.png to hicolor's sizes; a PNG path ships as-is at 1024x1024, which launchers ignore
        icon: "assets",
        syncDesktopName: true,
        target: [{
            target: "AppImage",
            arch: [
                "x64",
                "arm64"
            ]
        }, {
            target: "snap",
            arch: [
                "x64"
            ]
        }, {
            target: "deb",
            arch: [
                "x64",
                "arm64"
            ]
        }, {
            target: "tar.gz",
            arch: [
                "x64",
                "arm64"
            ]
        }],
        category: "Utility"
    }
} satisfies Configuration;
