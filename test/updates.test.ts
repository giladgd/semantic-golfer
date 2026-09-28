import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {setImmediate} from "node:timers/promises";
import {mock, test} from "node:test";
import {acquireLock, waitForLockRelease} from "lifecycle-utils";
import {selectRelease, findRelease} from "../electron/updates/releases.ts";
import {llmState} from "../electron/state/llmState.ts";

const stable = (tag: string) => ({"tag_name": tag, prerelease: false, draft: false});
const preview = (tag: string) => ({"tag_name": tag, prerelease: true, draft: false});

test("updates follow the running version's channel and compare semantic versions", async () => {
    const releases = [preview("v3.0.0-beta.1"), stable("v2.10.0"), stable("v2.9.0"),
        preview("v2.11.0-beta.2"), {...stable("v4.0.0"), draft: true}, stable("broken"), null];
    assert.equal(selectRelease(releases, "2.9.0")?.version, "2.10.0");
    assert.equal(selectRelease(releases, "2.11.0-beta.1")?.version, "3.0.0-beta.1");
    assert.equal(selectRelease([preview("v2.0.0-beta.10")], "2.0.0-beta.9")?.version, "2.0.0-beta.10");
    assert.equal(selectRelease([stable("v2.0.0")], "2.0.0-beta.1"), undefined);
    assert.equal(selectRelease([stable("v2.0.0")], "2.0.0"), undefined);
    assert.equal(selectRelease([stable("v1.0.0")], "2.0.0"), undefined);
    const requests: string[] = [];
    const fetch = mock.method(globalThis, "fetch", async (url: string) => {
        requests.push(url);
        return url.includes("page=2") ? Response.json([preview("v2.0.0-beta.2")]) :
            Response.json([stable("v1.0.0")], {headers: {link: '<https://api.github.com/repos/giladgd/semantic-golfer/releases?page=2>; rel="next"'}});
    });
    try {
        assert.equal((await findRelease("2.0.0-beta.1"))?.version, "2.0.0-beta.2");
        assert.equal(requests.length, 2);
        fetch.mock.mockImplementation(async () => new Response(null, {status: 404}));
        assert.equal(await findRelease("1.0.0"), undefined);
        fetch.mock.mockImplementation(async () => new Response(null, {status: 403}));
        await assert.rejects(findRelease("1.0.0"), /GitHub update check failed/);
    } finally {
        fetch.mock.restore();
    }
});

test("updates require a click, coalesce downloads, report progress, retain dismissals, and wait for score saves", async () => {
    const originalImage = process.env.APPIMAGE;
    const originalResources = Object.getOwnPropertyDescriptor(process, "resourcesPath");
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", {...originalPlatform, value: "linux"});
    Object.defineProperty(process, "resourcesPath", {value: "/nonexistent-update-test", configurable: true});
    process.env.APPIMAGE = "/test/Semantic-Golfer.AppImage";
    const app = Object.assign(new EventEmitter(), {isPackaged: true, name: "Semantic Golfer", getVersion: () => "1.0.0"});
    const native = Object.assign(new EventEmitter(), {
        checks: 0, downloads: 0, installs: 0,
        setFeedURL(feed: {url: string}) {
            assert.equal(feed.url, "https://github.com/giladgd/semantic-golfer/releases/download/v1.1.0/");
        },
        async checkForUpdates() {
            this.checks++;
            return {isUpdateAvailable: true, updateInfo: {version: "1.1.0"}};
        },
        async downloadUpdate() {
            this.downloads++;
            await downloaded.promise;
        },
        quitAndInstall(silent: boolean, restart: boolean) {
            assert.equal(silent, false);
            assert.equal(restart, true);
            this.installs++;
        }
    });
    const opened: string[] = [];
    const menus: unknown[] = [];
    mock.module("electron", {namedExports: {app, shell: {openExternal: async (url: string) => opened.push(url)},
        Menu: {setApplicationMenu: (menu: unknown) => menus.push(menu), buildFromTemplate: (menu: unknown) => menu}}});
    mock.module("electron-updater", {defaultExport: {autoUpdater: native}});
    mock.method(globalThis, "fetch", async () => Response.json(stable("v1.1.0")));
    const {checkForUpdates, installUpdate, dismissUpdate} = await import("../electron/updates/updates.ts");
    let downloaded = Promise.withResolvers<void>();
    try {
        await checkForUpdates(true);
        assert.equal(llmState.state.update?.status, "available");
        assert.equal(llmState.state.update?.manual, undefined);
        assert.equal(native.downloads, 0);
        dismissUpdate();
        await checkForUpdates();
        assert.equal(llmState.state.update?.dismissed, true);
        await checkForUpdates(true);
        assert.equal(llmState.state.update?.dismissed, false);
        installUpdate();
        installUpdate();
        await setImmediate();
        assert.equal(native.downloads, 1);
        native.emit("download-progress", {percent: 42});
        assert.equal(llmState.state.update?.progress, 0.42);
        const saving = await acquireLock([llmState, "scores"]);
        downloaded.resolve();
        await setImmediate();
        assert.equal(native.installs, 0);
        saving.dispose();
        await waitForLockRelease([llmState, "updates"]);
        assert.equal(native.installs, 1);

        llmState.state = {...llmState.state, update: undefined};
        await checkForUpdates(true);
        downloaded = Promise.withResolvers();
        installUpdate();
        await setImmediate();
        downloaded.reject(new Error("Checksum mismatch"));
        await waitForLockRelease([llmState, "updates"]);
        assert.equal(llmState.state.update?.status, "error");
        assert.match(llmState.state.update!.error!, /Checksum mismatch/);
        assert.equal(native.installs, 1);

        delete process.env.APPIMAGE;
        await checkForUpdates(true);
        assert.match(llmState.state.update!.manual!, /downloaded app/);
        installUpdate();
        await setImmediate();
        assert.deepEqual(opened, ["https://github.com/giladgd/semantic-golfer/releases/tag/v1.1.0"]);

        const {configureMenu} = await import("../electron/menu.ts");
        configureMenu(() => {});
        assert.equal(menus.at(-1), null);
        Object.defineProperty(process, "platform", {...originalPlatform, value: "darwin"});
        configureMenu(() => {});
        assert.match(JSON.stringify(menus.at(-1)), /Check for Updates/);
    } finally {
        Object.defineProperty(process, "platform", originalPlatform);
        if (originalResources)
            Object.defineProperty(process, "resourcesPath", originalResources);
        else
            Reflect.deleteProperty(process, "resourcesPath");
        if (originalImage == null)
            delete process.env.APPIMAGE;
        else
            process.env.APPIMAGE = originalImage;
        mock.restoreAll();
    }
});
