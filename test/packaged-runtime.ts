// Run after packaging: `npx electron test/packaged-runtime.ts` (use xvfb-run on headless Linux).
import assert from "node:assert/strict";
import {glob} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {app} from "electron";
import {assertDecisionSupport} from "../shared/runtimeCompatibility.ts";

try {
    const archives: string[] = [];
    for await (const archive of glob(["release/*-unpacked/resources/app.asar", "release/mac*/*.app/Contents/Resources/app.asar"]))
        archives.push(archive);
    assert.equal(archives.length, 1, "Expected one packaged app for this platform and architecture");
    const libraryUrl = pathToFileURL(path.resolve(archives[0]!, "node_modules/node-llama-cpp/dist/index.js"));
    const {getLlama, LlamaModel} = await import(libraryUrl.href) as typeof import("node-llama-cpp");
    assertDecisionSupport(LlamaModel.prototype);
    // Load the packaged native module without requiring a model or GPU on the runner.
    await getLlama("lastBuild", {dryRun: true, usePrebuiltBinaries: false, skipDownload: true});
    console.info("Packaged structured-decision runtime loaded successfully.");
    app.exit(0);
} catch (error) {
    console.error(error);
    app.exit(1);
}
