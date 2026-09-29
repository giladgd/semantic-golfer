// Run after updating the SVG: `npx electron test/readme-demo-layout.ts` (use xvfb-run on headless Linux).
import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {app, BrowserWindow, nativeTheme} from "electron";

const profile = mkdtempSync(path.join(tmpdir(), "readme-layout-test-"));
app.setPath("userData", profile);
app.on("window-all-closed", () => {});

void app.whenReady().then(async () => {
    const window = new BrowserWindow({width: 1280, height: 720, useContentSize: true, show: false,
        webPreferences: {offscreen: true, backgroundThrottling: false}});
    try {
        for (const theme of ["light", "dark"] as const) {
            nativeTheme.themeSource = theme;
            await window.loadFile(fileURLToPath(new URL("../assets/demo.video.svg", import.meta.url)));
            const measure = async () => {
                const error = document.querySelector("parsererror");
                if (error != null)
                    throw new Error(error.textContent ?? "Invalid SVG");
                await document.fonts.ready;
                const animations = document.getAnimations();
                animations.forEach((animation) => animation.pause());
                const visible = (element: Element) => {
                    for (let parent: Element | null = element; parent != null; parent = parent.parentElement) {
                        const style = getComputedStyle(parent);
                        if (style.clipPath === "inset(100%)" || style.display === "none" || Number(style.opacity) === 0)
                            return false;
                    }
                    return true;
                };
                const samples = [];
                const duration = Number(document.documentElement.getAttribute("data-duration"));
                for (let at = 0; at < duration; at += 50) {
                    animations.forEach((animation) => {
                        animation.currentTime = at;
                    });
                    for (const board of document.querySelectorAll(".exportMovie .gameBoard")) {
                        if (visible(board)) {
                            const {x, y, width, height} = board.getBoundingClientRect();
                            samples.push({at, bounds: {x, y, width, height}});
                        }
                    }
                }
                const cursorFrames = [];
                for (const at of [duration - 50, duration - 1, duration, duration + 16, duration + 50]) {
                    animations.forEach((animation) => {
                        animation.currentTime = at;
                    });
                    const pointers = [...document.querySelectorAll(".exportMovie .pointer")].filter(visible);
                    const button = [...document.querySelectorAll(".exportMovie .topBar nav button")]
                        .find((element) => element.textContent === "Playground" && visible(element))!;
                    const target = button.getBoundingClientRect();
                    cursorFrames.push({at, count: pointers.length, onButton: pointers.every((pointer) => {
                        const {x, y} = pointer.getBoundingClientRect();
                        return x >= target.left && x <= target.right && y >= target.top && y <= target.bottom;
                    })});
                }
                return {samples, cursorFrames};
            };
            const {samples, cursorFrames}: Awaited<ReturnType<typeof measure>> =
                await window.webContents.executeJavaScript(`(${measure})()`);
            assert.ok(samples.length > 20, "The export must include a visible game round");
            for (const sample of samples)
                assert.deepEqual(sample.bounds, samples[0]!.bounds, `${theme}: the round layout changed at ${sample.at}ms`);
            for (const frame of cursorFrames) {
                assert.equal(frame.count, 1, `${theme}: the cursor must stay visible across the loop boundary at ${frame.at}ms`);
                assert.ok(frame.onButton, `${theme}: the cursor must stay on Playground across the loop boundary at ${frame.at}ms`);
            }
        }
        console.info("The exported round has stable bounds and the cursor loops from Playground in both themes.");
    } finally {
        window.destroy();
    }
})
    .finally(() => rm(profile, {recursive: true, force: true, maxRetries: 5}))
    .then(() => app.exit(0), (error) => {
        console.error(error);
        app.exit(1);
    });
