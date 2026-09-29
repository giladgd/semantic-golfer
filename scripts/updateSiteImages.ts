import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {mkdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {setTimeout} from "node:timers/promises";
import {fileURLToPath} from "node:url";
import {app, BrowserWindow, nativeTheme} from "electron";
import sharp from "sharp";
import {createServer} from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const size = {width: 4096, height: 2048};
const profile = mkdtempSync(path.join(tmpdir(), "semantic-golfer-images-"));
app.setPath("userData", profile);
nativeTheme.themeSource = "dark";
app.on("window-all-closed", () => {});

void app.whenReady().then(async () => {
    app.dock?.hide();
    const server = await createServer({
        configFile: path.join(root, "site/vite.config.ts"),
        server: {host: "127.0.0.1", port: 0, open: false},
        logLevel: "warn"
    });
    let window: BrowserWindow | undefined;
    try {
        await server.listen();
        window = new BrowserWindow({
            width: 1280, height: 640, useContentSize: true, show: false,
            webPreferences: {offscreen: true, backgroundThrottling: false}
        });
        const contents = window.webContents;
        contents.debugger.attach("1.3");
        const evaluate = <T, R>(callback: (argument: T) => R, argument?: T): Promise<Awaited<R>> =>
            contents.executeJavaScript(`(${callback})(${JSON.stringify(argument)})`);
        // Set CSS dimensions and output density separately, independent of the host display and page zoom.
        const setViewport = (width: number) => contents.debugger.sendCommand("Emulation.setDeviceMetricsOverride", {
            width, height: width / 2, deviceScaleFactor: size.width / width, mobile: false
        });
        const capture = async (width: number) => {
            assert.deepEqual(await evaluate(() => ({width: innerWidth, height: innerHeight})),
                {width, height: width / 2}, "The capture viewport must match the layout size.");
            const {data} = await contents.debugger.sendCommand("Page.captureScreenshot", {
                format: "png", captureBeyondViewport: false
            });
            const png = Buffer.from(data, "base64");
            const metadata = await sharp(png).metadata();
            assert.deepEqual({width: metadata.width, height: metadata.height}, size,
                "The exported PNG must have the requested pixel dimensions.");
            return png;
        };
        await window.loadURL(server.resolvedUrls!.local[0]!);
        await setViewport(1280);
        await waitUntil(() => evaluate(() => document.querySelector(".demoViewport .playground") != null));
        const text = await evaluate(async () => {
            document.body.style.overflow = "hidden";
            document.querySelector<HTMLElement>(".demoSection")!.style.animation = "none";
            Object.assign(document.querySelector<HTMLElement>(".demoFrame")!.style, {
                position: "fixed", inset: "0", width: "1280px", height: "640px", zIndex: "100"
            });
            document.querySelector<HTMLElement>(".demoViewport")!.style.height = "640px";
            const modulePath = "/demo/playback.ts";
            const {playbackState, timeline} = await import(modulePath) as typeof import("../site/demo/playback.ts");
            const step = timeline[0]!.steps.at(-1)!;
            playbackState.state = {scene: 0, elapsed: step.at + 800, playing: false, firstPlay: true};
            return step.document;
        });
        await waitUntil(() => evaluate((text) =>
            document.querySelector<HTMLTextAreaElement>("#documentText")?.value === text &&
            document.querySelector(".decisionResult")?.getAttribute("aria-busy") === "false" &&
            document.querySelector(".timing strong")?.textContent?.includes("ms") === true, text));
        const rect = await evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(document.getAnimations().filter((animation) =>
                animation.effect?.getComputedTiming().iterations !== Infinity)
                .map((animation) => animation.finished));
            const frame = document.querySelector(".demoFrame")!;
            const rect = frame.getBoundingClientRect();
            return {x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height)};
        });
        assert.equal(rect.width, 1280);
        assert.equal(rect.height, 640);
        assert.equal(rect.x, 0);
        assert.equal(rect.y, 0);
        assert.equal(await evaluate(() => document.querySelector(".decisionResult .error")?.textContent ?? ""), "");
        const previewPng = await capture(1280);

        await window.loadFile(path.join(root, "site/social-poster.html"));
        await setViewport(1200);
        await evaluate(async (image) => {
            document.querySelector<HTMLImageElement>(".preview")!.src = image;
            await document.fonts.ready;
            await Promise.all([...document.images].map((image) => image.decode()));
        }, `data:image/png;base64,${previewPng.toString("base64")}`);
        const posterPng = await capture(1200);

        const posterJpeg = await sharp(posterPng).jpeg({quality: 75, mozjpeg: true})
            .toBuffer();
        const socialPoster = await sharp(posterPng).resize(1280, 640)
            .png()
            .toBuffer();
        await mkdir(path.join(root, "assets"), {recursive: true});
        await writeFile(path.join(root, "assets/playground-preview.png"), previewPng);
        await writeFile(path.join(root, "assets/og-image.png"), posterPng);
        await writeFile(path.join(root, "assets/og-image.jpg"), posterJpeg);
        await writeFile(path.join(root, "assets/social.poster.png"), socialPoster);
        console.info("Updated assets: Playground and OG images (4096×2048, JPEG quality 75), plus social.poster.png (1280×640).");
    } finally {
        window?.destroy();
        await server.close();
    }
})
    .finally(() => rm(profile, {recursive: true, force: true, maxRetries: 5}))
    .then(() => app.exit(0), (error) => {
        console.error(error);
        app.exit(1);
    });

async function waitUntil(predicate: () => Promise<boolean>) {
    const deadline = Date.now() + 30_000;
    while (!await predicate()) {
        assert.ok(Date.now() < deadline, "Timed out waiting for the recorded Playground frame.");
        await setTimeout(50);
    }
}
