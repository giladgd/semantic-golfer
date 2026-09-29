// Run after `npm run build:npm`: `node --test test/npm-package.ts`.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {access, glob, readFile} from "node:fs/promises";
import path from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";
import {getModuleVersion} from "node-llama-cpp";

test("the npm package ships compiled code and direct runtimes without local dependencies or build scripts", async () => {
    const root = new URL("../npm-package/", import.meta.url);
    const source = new URL("../", import.meta.url);
    const sourcePkg = JSON.parse(await readFile(new URL("package.json", source), "utf8"));
    const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
    assert.deepEqual(sourcePkg.files, ["dist", "dist-electron", "dist-cli", "README.md", "LICENSE"]);
    assert.deepEqual(pkg.files, sourcePkg.files);
    assert.deepEqual(pkg.keywords, sourcePkg.keywords);
    assert.equal(pkg.name, "semantic-golfer");
    assert.deepEqual(pkg.publishConfig, {access: "public", tag: "latest"});
    assert.ok(!pkg.private);
    assert.ok(pkg.dependencies.electron);
    assert.ok(pkg.dependencies["electron-updater"]);
    assert.equal(new URL(pkg.homepage).href, "https://semantic-golfer.giladgd.com/");
    assert.match(await readFile(new URL("README.md", root), "utf8"), /https:\/\/semantic-golfer\.giladgd\.com\/?(?=["')\s])/);
    assert.match(pkg.dependencies["node-llama-cpp"], /^\d+\.\d+\.\d+/);
    assert.equal(pkg.dependencies["node-llama-cpp"], await getModuleVersion());
    assert.ok(pkg.dependencies["lifecycle-utils"]);
    assert.equal(pkg.devDependencies, undefined);
    assert.equal(pkg.scripts, undefined);
    await access(new URL(pkg.main, root));
    const launcher = await readFile(new URL(pkg.bin[pkg.name], root), "utf8");
    assert.ok(launcher.startsWith("#!/usr/bin/env node\n"));
    for (const file of [pkg.main, pkg.bin[pkg.name]])
        assert.match(await readFile(new URL(file, root), "utf8"), /\bfrom\s*["']node-llama-cpp["']/,
            `${file} must import node-llama-cpp from the installed dependency`);
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const [packed] = JSON.parse(execFileSync(npm, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
        cwd: fileURLToPath(root), encoding: "utf8", shell: process.platform === "win32"
    }));
    const files = packed.files.map(({path}: {path: string}) => path) as string[];
    assert.deepEqual(packed.bundled, [], "npm must install dependencies separately");
    assert.ok(files.every((file) => !/(^|\/)node_modules\/|\.(node|dll|dylib|so(\.\d+)*)$/.test(file)),
        "The npm package must not contain dependency directories or native binaries");
    for (const file of ["dist/index.html", "dist/icon.png", "dist/icon.svg", "dist-electron/index.js", "dist-electron/preload.mjs",
        "dist-cli/index.js", "dist-cli/prepareUpdate.js", "package.json", "README.md", "LICENSE",
        "dist/licenses/icons/LICENSE", "dist/licenses/icons/LICENSE-MIT", "dist/licenses/icons/LICENSES.md", "dist/licenses/Inter-OFL.txt"])
        assert.ok(files.includes(file), `Missing package file: ${file}`);
    assert.ok(files.some((file) => /^dist\/assets\/.*\.js$/.test(file)));
    assert.ok(files.some((file) => /^dist\/assets\/.*\.css$/.test(file)));
    assert.ok(files.some((file) => /^dist\/assets\/.*\.woff2$/.test(file)));
    assert.ok(files.every((file) => /^(?:dist|dist-electron|dist-cli)\//.test(file) ||
        ["package.json", "README.md", "LICENSE"].includes(file)));
    assert.ok(files.every((file) => !file.endsWith(".ts") && !file.endsWith(".gguf")));

    const [sourcePacked] = JSON.parse(execFileSync(npm, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
        cwd: fileURLToPath(source), encoding: "utf8", shell: process.platform === "win32"
    }));
    assert.deepEqual(sourcePacked.files.map(({path}: {path: string}) => path).sort(), [...files].sort());
    for await (const entry of glob(["dist/**/*", "dist-electron/**/*", "dist-cli/**/*"], {cwd: source, withFileTypes: true})) {
        if (!entry.isFile())
            continue;
        const file = path.relative(fileURLToPath(source), path.join(entry.parentPath, entry.name)).replaceAll(path.sep, "/");
        assert.ok(files.includes(file), `Missing built asset: ${file}`);
        assert.deepEqual(await readFile(new URL(file, root)), await readFile(new URL(file, source)), `Changed built asset: ${file}`);
    }
    assert.deepEqual(await readFile(new URL("dist/icon.png", root)), await readFile(new URL("assets/icon.png", source)));
    assert.deepEqual(await readFile(new URL("dist/icon.svg", root)), await readFile(new URL("public/icon.svg", source)));
});
