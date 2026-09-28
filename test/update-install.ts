// Linux only: npx electron test/update-install.ts (prefix xvfb-run -a on headless machines).
// Uses the real updater with a local HTTP feed and disposable executable fixtures, never an installed app.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {once} from "node:events";
import {createServer} from "node:http";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {tmpdir} from "node:os";
import {setTimeout} from "node:timers/promises";
import {app} from "electron";
import electronUpdater from "electron-updater";

if (process.platform !== "linux") {
    console.info("AppImage installation check runs on Linux.");
    app.exit(0);
} else {
    const profile = await mkdtemp(path.join(tmpdir(), "semantic-golfer-update-"));
    app.setPath("userData", profile);
    process.env.XDG_CACHE_HOME = profile;
    process.env.APPIMAGE = path.join(profile, "Semantic-Golfer.AppImage");
    process.env.SEMANTIC_GOLFER_TEST_MARKER = path.join(profile, "restarted");
    await writeFile(process.env.APPIMAGE, "old app");
    const payload = Buffer.from('#!/bin/sh\nprintf updated > "$SEMANTIC_GOLFER_TEST_MARKER"\n' + "# padding\n".repeat(100_000));
    const hash = createHash("sha512").update(payload)
        .digest("base64");
    let validHash = false;
    const server = createServer((request, response) => {
        if (request.url?.split("?")[0]?.endsWith(".yml"))
            response.end(JSON.stringify({version: "99.0.0", files: [{url: "fixture.AppImage", size: payload.length,
                sha512: validHash ? hash : Buffer.alloc(64).toString("base64")}]}));
        else {
            response.setHeader("content-length", payload.length);
            response.end(payload);
        }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const url = `http://127.0.0.1:${(server.address() as {port: number}).port}/`;
    void app.whenReady().then(async () => {
        try {
            const updater = new electronUpdater.AppImageUpdater({provider: "generic", url});
            updater.forceDevUpdateConfig = true;
            const configPath = path.join(profile, "update.yml");
            updater.updateConfigPath = configPath;
            await writeFile(configPath, JSON.stringify({provider: "generic", url, updaterCacheDirName: "fixture"}));
            updater.autoDownload = false;
            updater.autoInstallOnAppQuit = false;
            updater.disableDifferentialDownload = true;
            updater.on("error", () => {});
            const progress: number[] = [];
            updater.on("download-progress", ({percent}) => progress.push(percent));
            await updater.checkForUpdates();
            await assert.rejects(updater.downloadUpdate(), /checksum/i);
            assert.equal(await readFile(process.env.APPIMAGE, "utf8"), "old app");
            validHash = true;
            await updater.checkForUpdates();
            await updater.downloadUpdate();
            assert.ok(progress.some((percent) => percent > 0));
            app.once("before-quit", (event) => event.preventDefault());
            updater.quitAndInstall(false, true);
            for (let tries = 0; tries < 100; tries++) {
                if (await readFile(process.env.SEMANTIC_GOLFER_TEST_MARKER, "utf8").catch(() => "") === "updated")
                    break;
                await setTimeout(50);
            }
            assert.equal(await readFile(process.env.SEMANTIC_GOLFER_TEST_MARKER, "utf8"), "updated");
            assert.deepEqual(await readFile(process.env.APPIMAGE), payload);
            console.info("Checksum rejection, download progress, AppImage replacement, and restart passed.");
        } catch (error) {
            console.error(error);
            process.exitCode = 1;
        } finally {
            server.close();
            await rm(profile, {recursive: true, force: true});
            app.exit(process.exitCode ?? 0);
        }
    });
}
