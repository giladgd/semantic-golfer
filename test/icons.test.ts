import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import config from "../electron-builder.ts";
import type {PackContext} from "electron-builder";

test("Windows uses the ready-made ICO without running the icon converter", async (context) => {
    const {default: iconTools} = await import("app-builder-lib/out/toolsets/icons.js");
    const {convertIcon} = await import("app-builder-lib/out/util/iconConverter.js");
    context.mock.method(iconTools, "runIconsTool", () => {
        throw new Error("Windows builds must not run the icon conversion tool");
    });
    const result = await convertIcon({
        sources: [config.win.icon], fallbackSources: [], roots: [process.cwd()], format: "ico", outDir: "release/.icon-ico"
    });
    assert.deepEqual(result, {icons: [{file: path.resolve(config.win.icon), size: 256}], isFallback: false});
});

test("Linux icon set only uses sizes the hicolor theme indexes", async () => {
    const {convertIcon} = await import("app-builder-lib/out/util/iconConverter.js");
    const {icons} = await convertIcon({
        sources: [config.linux.icon], fallbackSources: [], roots: [process.cwd()], format: "set", outDir: "release/.icon-set"
    });
    // The sizes hicolor's index.theme declares; launchers don't look up icons in other directories.
    const hicolorSizes = [16, 22, 24, 32, 36, 48, 64, 72, 96, 128, 192, 256, 512];
    const sizes = icons.map((icon) => icon.size);
    assert.ok(sizes.every((size) => hicolorSizes.includes(size)), `Unindexed icon sizes: ${sizes.join(", ")}`);
    assert.equal(sizes.at(-1), 512);
});

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
        const resources = path.join(appOutDir, `${config.productName}.app/Contents/Resources`);
        await mkdir(resources, {recursive: true});
        await writeFile(path.join(resources, "Assets.car"), "Native appearance catalog");
        const context = {
            appOutDir,
            electronPlatformName: "darwin",
            packager: {
                projectDir: process.cwd(),
                getResourcesDir: (directory: string) => {
                    assert.equal(directory, appOutDir);
                    return resources;
                }
            }
        } as PackContext;
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
