import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import config from "../electron-builder.ts";
import type {PackContext} from "electron-builder";

test("Icon Composer produces a native macOS catalog and compatibility icon", {skip: process.platform !== "darwin"}, async () => {
    const {generateAssetCatalogForIcon} = await import("app-builder-lib/out/util/macosIconComposer.js");
    const {assetCatalog, icnsFile} = await generateAssetCatalogForIcon(config.mac.icon);
    assert.ok(assetCatalog.length > 0, "actool must produce a nonempty Assets.car");
    assert.equal(icnsFile.toString("ascii", 0, 4), "icns");
    assert.equal(icnsFile.readUInt32BE(4), icnsFile.length);
});

test("macOS retains native icon appearances and a dark fallback for older systems", async () => {
    const icon = JSON.parse(await readFile(path.join(config.mac.icon, "icon.json"), "utf8"));
    assert.ok(icon["fill-specializations"].some((fill: {appearance?: string}) => fill.appearance === "dark"));
    assert.ok(icon["fill-specializations"].some((fill: {appearance?: string}) => fill.appearance == null));
    for (const group of icon.groups) {
        for (const layer of group.layers)
            assert.ok((await readFile(path.join(config.mac.icon, "Assets", layer["image-name"]))).length > 0);
    }

    const appOutDir = await mkdtemp(path.join(tmpdir(), "semantic-golfer-icons-"));
    try {
        const resources = path.join(appOutDir, "Semantic Golfer.app/Contents/Resources");
        await mkdir(resources, {recursive: true});
        await writeFile(path.join(resources, "Assets.car"), "Native appearance catalog");
        const context = {appOutDir, electronPlatformName: "darwin"} as PackContext;
        await config.afterPack(context);
        const fallback = await readFile(path.join(resources, "icon.icns"));
        assert.equal(fallback.toString("ascii", 0, 4), "icns");
        assert.equal(fallback.readUInt32BE(4), fallback.length);
        assert.deepEqual(fallback, await readFile("assets/icon.icns"));
        assert.equal(await readFile(path.join(resources, "Assets.car"), "utf8"), "Native appearance catalog");

        await writeFile(path.join(resources, "icon.icns"), "Unchanged");
        await config.afterPack({...context, electronPlatformName: "linux"});
        assert.equal(await readFile(path.join(resources, "icon.icns"), "utf8"), "Unchanged");
    } finally {
        await rm(appOutDir, {recursive: true, force: true});
    }
});
