import path from "node:path";
import {readFile} from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {app, shell} from "electron";
import electronUpdater, {type AppUpdater} from "electron-updater";
import {isLockActive, LongTimeout, withLock} from "lifecycle-utils";
import {prerelease} from "semver";
import {llmState} from "../state/llmState.ts";
import {findRelease, repository, type AppRelease} from "./releases.ts";
import type {AppUpdate} from "../../shared/appUpdate.ts";

const scope = [llmState, "updates"] as const;
let release: AppRelease | undefined;
let updater: AppUpdater | undefined;

function setUpdate(update: AppUpdate) {
    llmState.state = {...llmState.state, update};
}

export function dismissUpdate() {
    const update = llmState.state.update;
    if (update)
        setUpdate({...update, dismissed: true});
}

async function manualUpdateReason() {
    if (process.env.SEMANTIC_GOLFER_LAUNCHER === "1")
        return process.connected && process.env.npm_execpath ? undefined : "Run npx -y semantic-golfer@latest to update this installation.";
    if (!app.isPackaged)
        return "Update the source checkout to use a newer development build.";
    if (process.platform === "darwin") {
        const signature = await promisify(execFile)("/usr/bin/codesign", ["-dv", "--verbose=2", app.getPath("exe")])
            .catch(() => ({stderr: ""}));
        if (!/^TeamIdentifier=(?!not set$)\S+$/m.test(signature.stderr))
            return "This unsigned macOS build needs to be replaced with the downloaded app.";
    }
    if (process.platform === "linux" && !process.env.APPIMAGE) {
        const type = await readFile(path.join(process.resourcesPath, "package-type"), "utf8").catch(() => "");
        if (type.trim() !== "deb")
            return process.env.SNAP ? "Update this installation through Snap." : "Replace this installation with the downloaded app.";
    }
    return undefined;
}

function nativeUpdater() {
    if (updater)
        return updater;
    updater = electronUpdater.autoUpdater;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.autoRunAppAfterInstall = true;
    updater.allowDowngrade = false;
    updater.allowPrerelease = prerelease(app.getVersion()) != null;
    updater.disableWebInstaller = true;
    updater.on("error", (error) => {
        console.error("App update:", error);
        if (["downloading", "installing"].includes(llmState.state.update?.status ?? ""))
            setUpdate({status: "error", version: release?.version, error: String(error)});
    });
    updater.on("download-progress", ({percent}) => {
        if (llmState.state.update?.status === "downloading")
            setUpdate({...llmState.state.update, progress: Math.max(0, Math.min(1, percent / 100))});
    });
    return updater;
}

export async function checkForUpdates(manual = false) {
    if (isLockActive(scope) || ["downloading", "installing"].includes(llmState.state.update?.status ?? ""))
        return;
    await withLock(scope, async () => {
        const previous = llmState.state.update;
        setUpdate({status: "checking", dismissed: !manual});
        try {
            release = await findRelease(app.getVersion());
            if (!release) {
                setUpdate({status: "current", dismissed: !manual});
                return;
            }
            setUpdate({status: "available", version: release.version, manual: await manualUpdateReason(),
                dismissed: !manual && previous?.version === release.version && previous.dismissed});
        } catch (error) {
            setUpdate({status: "error", error: String(error), dismissed: !manual});
        }
    });
}

export function installUpdate() {
    if (isLockActive(scope) || !release || !["available", "error"].includes(llmState.state.update?.status ?? ""))
        return;
    const selected = release;
    const update = llmState.state.update!;
    if (update.manual) {
        void shell.openExternal(`${repository}/releases/tag/${encodeURIComponent(selected.tag)}`).catch((error) => {
            setUpdate({...update, status: "error", error: String(error), dismissed: false});
        });
        return;
    }
    setUpdate({status: "downloading", version: selected.version});
    void withLock(scope, async () => {
        try {
            if (process.env.SEMANTIC_GOLFER_LAUNCHER === "1") {
                if (!process.connected || !process.send)
                    throw new Error("The npm launcher is no longer connected. Restart the app and try again.");
                process.send({type: "semantic-golfer:update", version: selected.version}, (error) => {
                    if (error)
                        setUpdate({status: "error", version: selected.version, error: String(error)});
                });
                return;
            }
            const native = nativeUpdater();
            // Pin metadata and downloads to the exact release selected from GitHub, including prereleases.
            native.setFeedURL({provider: "generic", url: `${repository}/releases/download/${encodeURIComponent(selected.tag)}/`});
            const result = await native.checkForUpdates();
            if (!result?.isUpdateAvailable || result.updateInfo.version !== selected.version)
                throw new Error("The release update files do not match this version. Try again later.");
            await native.downloadUpdate();
            setUpdate({status: "installing", version: selected.version, progress: 1});
            await withLock([llmState, "scores"], () => {});
            native.quitAndInstall(false, true);
        } catch (error) {
            setUpdate({status: "error", version: selected.version, error: String(error)});
        }
    });
}

export function initializeUpdates() {
    process.on("message", (message) => {
        if (process.env.SEMANTIC_GOLFER_LAUNCHER !== "1" || llmState.state.update?.status !== "downloading" ||
            message == null || typeof message !== "object" || !("type" in message))
            return;
        if (message.type === "semantic-golfer:update-ready") {
            setUpdate({status: "installing", version: release?.version, progress: 1});
            void withLock([llmState, "scores"], () => app.quit());
        } else if (message.type === "semantic-golfer:update-error" && "error" in message && typeof message.error === "string")
            setUpdate({status: "error", version: release?.version, error: message.error});
    });
    // Development builds must never update the source checkout or contact GitHub automatically.
    if (!app.isPackaged && process.env.SEMANTIC_GOLFER_LAUNCHER !== "1")
        return;
    let timer: LongTimeout;
    const check = async () => {
        await checkForUpdates();
        timer = new LongTimeout(check, 4 * 60 * 60 * 1000);
    };
    timer = new LongTimeout(check, 5_000);
    app.once("will-quit", () => timer.dispose());
}
