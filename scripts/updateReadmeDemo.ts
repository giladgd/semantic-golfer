import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {setTimeout} from "node:timers/promises";
import {fileURLToPath} from "node:url";
import {app, BrowserWindow} from "electron";
import {createServer, transformWithEsbuild} from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const profile = mkdtempSync(path.join(tmpdir(), "semantic-golfer-svg-"));
app.setPath("userData", profile);
app.commandLine.appendSwitch("force-device-scale-factor", "1");
app.on("window-all-closed", () => {});

void app.whenReady().then(async () => {
    app.dock?.hide();
    const server = await createServer({configFile: path.join(root, "site/vite.config.ts"),
        server: {host: "127.0.0.1", port: 0, open: false, watch: null}, logLevel: "warn"});
    let window: BrowserWindow | undefined;
    try {
        await server.listen();
        window = new BrowserWindow({width: 1400, height: 1000, show: false,
            webPreferences: {offscreen: true, backgroundThrottling: false}});
        window.webContents.on("console-message", ({level, message}) => {
            if (level === "error")
                console.error(message);
            else if (message.startsWith("[readme-demo]"))
                console.info(message);
        });
        window.webContents.setFrameRate(60);
        await window.loadURL(server.resolvedUrls!.local[0]!);
        const evaluate = <T, R>(callback: (argument: T) => R, argument?: T): Promise<Awaited<R>> =>
            window!.webContents.executeJavaScript(`(${callback})(${JSON.stringify(argument)})`);
        const deadline = Date.now() + 30_000;
        while (!await evaluate(() => document.querySelector(".demoViewport .playground") != null)) {
            assert.ok(Date.now() < deadline, "Timed out loading the website demo");
            await setTimeout(50);
        }
        await evaluate(async () => {
            document.querySelector<HTMLElement>(".demoSection")!.style.animation = "none";
            Object.assign(document.querySelector<HTMLElement>(".demoFrame")!.style,
                {position: "fixed", inset: "0", width: "1280px", height: "720px", zIndex: "100"});
            await document.fonts.ready;
        });
        const font = await readFile(path.join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"));
        const fontLicense = await readFile(path.join(root, "node_modules/@fontsource-variable/inter/LICENSE"), "utf8");
        console.info("Preparing the website demo with the current evaluation data…");
        const result = await evaluate(async ({modulePath, font}) => {
            const {recordReadmeDemo, compileReadmeDemo} = await import(modulePath) as typeof import("./readmeDemo.ts");
            const {frames, duration, styles} = await recordReadmeDemo();
            return {svg: compileReadmeDemo(frames, duration, styles, font), frames: frames.length, duration};
        }, {modulePath: `/@fs/${path.join(root, "scripts/readmeDemo.ts")}`, font: font.toString("base64")});
        const style = result.svg.match(/<style><!\[CDATA\[([\s\S]*?)\]\]><\/style>/)!;
        const {code} = await transformWithEsbuild(style[1]!, "demo.video.css", {loader: "css", minify: true});
        result.svg = result.svg.replace(style[0], () => `<style><![CDATA[${code.trim()}]]></style>`);
        assert.ok(!/<script\b|\son\w+=|<iframe\b/i.test(result.svg), "The export must not contain executable content");
        assert.ok(!/(?:src|href)="(?!data:|#)/.test(result.svg), "The export must be self-contained");
        result.svg = `<!-- Embedded Inter font license:\n${fontLicense.replace(/--/g, "—")}\n-->\n${result.svg}`;
        await mkdir(path.join(root, "assets"), {recursive: true});
        await writeFile(path.join(root, "assets/demo.video.svg"), result.svg);
        console.info(`Wrote assets/demo.video.svg (${Math.round(Buffer.byteLength(result.svg) / 1024)} KB, ` +
            `${result.frames} samples, ${Math.round(result.duration / 1000)} seconds, no scripts).`);
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
