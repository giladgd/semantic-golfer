// Run after packaging: `npx electron test/packaged-runtime.ts` (use xvfb-run on headless Linux).
import assert from "node:assert/strict";
import {access, glob, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {app} from "electron";

void app.whenReady().then(async () => {
    const archives: string[] = [];
    for await (const archive of glob(["release/*-unpacked/resources/app.asar", "release/mac*/*.app/Contents/Resources/app.asar"]))
        archives.push(archive);
    assert.equal(archives.length, 1, "Expected one packaged app for this platform and architecture");
    const archive = path.resolve(archives[0]!);
    for (const name of await readdir(archive))
        assert.ok(["dist", "dist-electron", "node_modules", "package.json", "LICENSE"].includes(name), `Unexpected packaged file: ${name}`);
    for await (const entry of glob(["dist/**/*", "dist-electron/**/*", "LICENSE"], {withFileTypes: true})) {
        if (!entry.isFile())
            continue;
        const source = path.join(entry.parentPath, entry.name);
        const file = path.relative(process.cwd(), source);
        assert.deepEqual(await readFile(path.join(archive, file)), await readFile(source), `Missing or changed packaged asset: ${file}`);
    }
    for (const file of ["dist/index.html", "dist/icon.png", "dist/icon.svg", "dist-electron/index.js", "dist-electron/preload.mjs",
        "dist/licenses/icons/LICENSE", "dist/licenses/icons/LICENSE-MIT", "dist/licenses/icons/LICENSES.md", "dist/licenses/Inter-OFL.txt"])
        await access(path.join(archive, file));
    assert.deepEqual(await readFile(path.join(archive, "dist/icon.png")), await readFile("assets/icon.png"));
    assert.deepEqual(await readFile(path.join(archive, "dist/icon.svg")), await readFile("public/icon.svg"));
    if (process.platform === "darwin") {
        assert.deepEqual(await readFile(path.join(archive, "../icon.icns")), await readFile("assets/icon.icns"));
        await access(path.join(archive, "../Assets.car"));
    }
    const libraryUrl = pathToFileURL(path.join(archive, "node_modules/node-llama-cpp/dist/index.js"));
    const {getLlama} = await import(libraryUrl.href) as typeof import("node-llama-cpp");
    // Load the packaged native module without requiring a model or GPU on the runner.
    await getLlama("lastBuild", {dryRun: true, usePrebuiltBinaries: false, skipDownload: true});
    console.info("Packaged assets verified and inference runtime loaded successfully.");
    app.exit(0);
})
    .catch((error) => {
        console.error(error);
        app.exit(1);
    });
