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
    icon: "public/icon.png",
    artifactName: "Semantic-Golfer-${version}-${os}-${arch}.${ext}",
    publish: null,
    forceCodeSigning: Boolean(process.env.CSC_LINK),
    directories: {
        output: "release"
    },

    files: [
        "dist",
        "dist-electron",
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
            await copyFile("build/icon.icns", path.join(appOutDir, `${productName}.app/Contents/Resources/icon.icns`));
        }
    },
    mac: {
        icon: "build/SemanticGolfer.icon",
        category: "public.app-category.productivity",
        // Let Electron Builder sign the final bundle, including native libraries and entitlements.
        identity: process.env.CSC_LINK || process.env.CSC_NAME ? undefined : "-",
        notarize: Boolean(process.env.APPLE_ID),
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
        icon: "public/icon.png",
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
