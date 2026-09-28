import {copyFile} from "node:fs/promises";
import path from "node:path";
import type {Configuration} from "electron-builder";

const appId = "ai.withcat.semantic-golfer";
const productName = "Semantic Golfer";
const executableName = "semantic-golfer";

/**
 * @see - https://www.electron.build/configuration/configuration
 */
export default {
    appId: appId,
    asar: true,
    productName: productName,
    executableName: executableName,
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
        "!node_modules/node-llama-cpp/llama/llama.cpp/**/*",
        "!node_modules/node-llama-cpp/llama/gitRelease.bundle",
        "!node_modules/node-llama-cpp/bins/**/*",
        "node_modules/node-llama-cpp/bins/${os}-${arch}*/**/*",
        "!node_modules/node-llama-cpp/llama/localBuilds/**/*",
        "node_modules/node-llama-cpp/llama/localBuilds/${os}-${arch}*/Release/**/*",
        "node_modules/node-llama-cpp/llama/localBuilds/${os}-${arch}*/buildDone.status",
        "!node_modules/@node-llama-cpp/*/bins/**/*",
        "node_modules/@node-llama-cpp/${os}-${arch}*/bins/**/*"
    ],
    asarUnpack: [
        "node_modules/node-llama-cpp/bins",
        "node_modules/node-llama-cpp/llama/localBuilds",
        "node_modules/@node-llama-cpp/*"
    ],
    afterPack: async ({electronPlatformName, appOutDir}) => {
        if (electronPlatformName === "darwin") {
            // Older macOS versions use the dark ICNS; newer versions use Icon Composer's appearances.
            await copyFile("assets/icon.icns", path.join(appOutDir, `${productName}.app/Contents/Resources/icon.icns`));
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
        // Match the Ubuntu runner and include the C++ runtime needed by the native engine.
        base: "core22",
        core22: {
            useTemplateApp: false,
            stagePackages: ["default", "libstdc++6"]
        }
    },
    linux: {
        icon: "assets/icon.png",
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
