import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";
import {getReleaseAssets, getReleaseBodyTemplate} from "../scripts/releaseAssets.ts";
import builderConfig from "../electron-builder.ts";
import type {LinuxPackager} from "app-builder-lib/out/linuxPackager.js";
import type {Packager} from "app-builder-lib/out/packager.js";

test("desktop builds use the display name on macOS and Windows and a shell-friendly Linux executable", async () => {
    const {AppInfo} = await import("app-builder-lib/out/appInfo.js");
    const metadata = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    for (const platform of ["mac", "win", "linux"] as const) {
        const appInfo = new AppInfo({config: builderConfig, metadata} as Packager, undefined, builderConfig[platform]);
        assert.equal(appInfo.productFilename, platform === "linux" ? "semantic-golfer" : "Semantic Golfer");
        assert.equal(appInfo.productName, "Semantic Golfer");
    }
});

test("CI builds the six supported platform/architecture pairs with all configured package formats", async () => {
    const {load} = createRequire(import.meta.url)("js-yaml");
    const workflow = load(await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8"));
    assert.doesNotMatch(JSON.stringify(workflow), /source (?:download|build)|NODE_LLAMA_CPP_CMAKE_OPTION/,
        "CI must use the installed prebuilt runtime without forcing a source build");
    const matrix: Array<{platform: "mac" | "win" | "linux", arch: string, targets: string}> = workflow.jobs.build.strategy.matrix.include;
    assert.deepEqual(matrix.map(({platform, arch}) => `${platform}-${arch}`).sort(),
        ["linux-arm64", "linux-x64", "mac-arm64", "mac-x64", "win-arm64", "win-x64"]);
    for (const {platform, arch, targets} of matrix) {
        const expected = builderConfig[platform].target.filter((target) => target.arch.includes(arch)).map(({target}) => target);
        assert.deepEqual(targets.split(" ").sort(), expected.sort(), `${platform}-${arch} package formats`);
    }
    assert.deepEqual(workflow.jobs.release.needs, ["check", "build"]);
    const allowedEvents = "(github.event_name == 'push' || github.event_name == 'workflow_dispatch') && github.ref == 'refs/heads/master'";
    assert.equal(workflow.jobs.check.steps.find(({id}: {id?: string}) => id === "version").if, allowedEvents);
    assert.equal(workflow.jobs.release.if, `${allowedEvents} && needs.check.outputs.version != ''`);
    assert.deepEqual(workflow.jobs.release.environment, {
        name: "npm", url: "https://www.npmjs.com/package/semantic-golfer/v/${{ needs.check.outputs.version }}"
    });
    for (const permission of ["contents", "issues", "pull-requests", "id-token"])
        assert.equal(workflow.jobs.release.permissions[permission], "write");
    assert.doesNotMatch(JSON.stringify(workflow.jobs.release), /NPM_TOKEN|NODE_AUTH_TOKEN/,
        "npm publishing must use OIDC without an npm token secret");
    const lxdSetup = workflow.jobs.build.steps.find(({uses}: {uses?: string}) => uses?.startsWith("canonical/setup-lxd@"));
    assert.equal(lxdSetup?.if, "matrix.platform == 'linux' && matrix.arch == 'x64'");
    assert.equal(builderConfig.snapcraft.core24.useLXD, true);
    assert.doesNotMatch(JSON.stringify(workflow.jobs.build), /SNAP_DESTRUCTIVE_MODE/,
        "Snap's GNOME extension needs an isolated build environment");
});

test("Snap packaging uses the modern GNOME extension and retains model access and native dependencies", async (context) => {
    const {LinuxTargetHelper} = await import("app-builder-lib/out/targets/LinuxTargetHelper.js");
    const {Arch} = await import("builder-util");
    const metadata = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    const helper = new LinuxTargetHelper({
        config: builderConfig,
        platformSpecificBuildOptions: builderConfig.linux,
        executableName: builderConfig.linux.executableName,
        appInfo: {version: metadata.version, productName: builderConfig.productName, description: metadata.description},
        info: {metadata}
    } as LinuxPackager);
    context.mock.getter(helper, "icons", async () => []);
    const snap = await helper.getSnapCore().createDescriptor(Arch.x64);
    const app = snap.apps[builderConfig.linux.executableName];
    assert.equal(snap.base, "core24");
    assert.deepEqual(app.extensions, ["gnome"]);
    assert.equal(app.command, `app/${builderConfig.linux.executableName}`);
    for (const plug of ["home", "network", "browser-support"])
        assert.ok(app.plugs.includes(plug), `${plug} must remain available`);
    assert.equal(snap.plugs["browser-support"]["allow-sandbox"], true);
    assert.ok(snap.parts[builderConfig.linux.executableName]["stage-packages"].includes("libstdc++6"));
    assert.doesNotMatch(JSON.stringify(snap), /gnome-3-28-1804|desktop-gtk2|desktop-gnome-specific/);
});

test("semantic-release waits for npm publication and stops before GitHub when npm fails", async () => {
    const {default: pipeline} = await import(new URL("./lib/plugins/pipeline.js", import.meta.resolve("semantic-release")).href);
    const {default: definitions} = await import(new URL("./lib/definitions/plugins.js", import.meta.resolve("semantic-release")).href);
    const config = JSON.parse(await readFile(new URL("../.releaserc.json", import.meta.url), "utf8"));
    const publishers = config.plugins.slice(2);
    assert.deepEqual(publishers.map(([name]: [string]) => name), ["@semantic-release/npm", "@semantic-release/github"]);
    assert.equal(publishers[0][1].npmPublish, true);
    assert.equal(publishers[0][1].pkgRoot, "npm-package");
    assert.equal(publishers[1][1].successComment, undefined);
    assert.equal(publishers[1][1].successCommentCondition, undefined);
    assert.equal(publishers[1][1].releasedLabels, undefined);

    for (const failNpm of [false, true]) {
        const started = Promise.withResolvers<void>();
        const gate = Promise.withResolvers<void>();
        const published: string[] = [];
        const publishing = pipeline(publishers.map(([name]: [string]) => async () => {
            if (name === "@semantic-release/npm") {
                started.resolve();
                await gate.promise;
                if (failNpm)
                    throw new Error("npm publication failed");
            }
            published.push(name);
            return {name};
        }), definitions.publish.pipelineConfig())({nextRelease: {version: "1.0.0"}});
        const outcome = failNpm ? assert.rejects(publishing, /npm publication failed/) : publishing;
        await started.promise;
        assert.deepEqual(published, [], "GitHub must wait until npm publication succeeds");
        gate.resolve();
        await outcome;
        assert.deepEqual(published, failNpm ? [] : ["@semantic-release/npm", "@semantic-release/github"]);
    }
});

test("release planning and publishing require the same version and every platform artifact", async () => {
    const root = fileURLToPath(new URL("../", import.meta.url));
    const temp = await mkdtemp(path.join(tmpdir(), "live-decisions-release-"));
    const repo = path.join(temp, "repo");
    const remote = path.join(temp, "remote.git");
    // Resolve the disposable repository's branch, including when this test runs on a pull request.
    const env = {...process.env, CI: "", GITHUB_ACTIONS: "", GITHUB_OUTPUT: path.join(temp, "output"), RELEASE_VERSION: "1.0.0"};
    const git = (...args: string[]) => execFileSync("git", args, {cwd: repo, env, encoding: "utf8", stdio: "pipe"});
    const release = (...args: string[]) => execFileSync(process.execPath, ["scripts/release.ts", ...args], {
        cwd: repo, env, encoding: "utf8", stdio: "pipe"
    });
    try {
        await mkdir(repo);
        git("init", "--bare", remote);
        git("init", "-b", "master");
        git("config", "user.email", "test@example.com");
        git("config", "user.name", "Release test");
        git("config", "commit.gpgsign", "false");
        git("config", "tag.gpgsign", "false");
        git("remote", "add", "origin", remote);
        await writeFile(path.join(repo, "package.json"), '{"type":"module"}');
        await writeFile(path.join(repo, ".gitignore"), "node_modules\nrelease\nnpm-package\n");
        await symlink(path.join(root, "node_modules"), path.join(repo, "node_modules"), "junction");
        await cp(path.join(root, "scripts"), path.join(repo, "scripts"), {recursive: true});
        await cp(path.join(root, "electron-builder.ts"), path.join(repo, "electron-builder.ts"));
        const config = JSON.parse(await readFile(path.join(root, ".releaserc.json"), "utf8"));
        config.repositoryUrl = pathToFileURL(remote).href;
        config.ci = false;
        // Exercise tags and npm packing against a disposable local remote, without publishing anywhere.
        const npmPlugin = config.plugins.find(([name]: [string]) => name === "@semantic-release/npm");
        assert.ok(npmPlugin);
        config.plugins = [...config.plugins.slice(0, 2), [npmPlugin[0], {...npmPlugin[1], npmPublish: false}]];
        await mkdir(path.join(repo, "npm-package"));
        await writeFile(path.join(repo, "npm-package/package.json"), JSON.stringify({name: "semantic-golfer", version: "0.0.0"}));
        await writeFile(path.join(repo, ".releaserc.json"), JSON.stringify(config));
        git("add", ".");
        git("commit", "-m", "feat: initial app");
        git("push", "-u", "origin", "master");

        release("--dry-run");
        assert.match(await readFile(env.GITHUB_OUTPUT, "utf8"), /version=1\.0\.0/);
        assert.equal(git("tag").trim(), "");
        env.RELEASE_VERSION = "1.0.1";
        assert.throws(() => release(), /Release changed since the builds started/);
        env.RELEASE_VERSION = "1.0.0";
        assert.throws(() => release(), /ENOENT/);
        assert.equal(git("tag").trim(), "");

        const assets = getReleaseAssets("1.0.0");
        assert.equal(assets.length, 13);
        assert.equal(new Set(assets).size, 13);
        assert.ok(assets.includes("Semantic-Golfer-1.0.0-linux-amd64.snap"));
        assert.ok(assets.includes("Semantic-Golfer-1.0.0-linux-amd64.deb"));
        assert.ok(assets.includes("Semantic-Golfer-1.0.0-linux-x86_64.AppImage"));
        assert.ok(!assets.some((name) => name.endsWith("arm64.snap")));
        await mkdir(path.join(repo, "release"));
        for (const asset of assets.slice(0, -1))
            await writeFile(path.join(repo, "release", asset), `Test build: ${asset}`);
        const lastAsset = path.join(repo, "release", assets.at(-1)!);
        assert.throws(() => release(), /ENOENT/);
        assert.equal(git("tag").trim(), "", "a partial build set must not publish");
        await writeFile(lastAsset, "");
        assert.throws(() => release(), /Empty release artifact/);
        assert.equal(git("tag").trim(), "", "an unfinished artifact must not publish");
        await writeFile(lastAsset, `Test build: ${assets.at(-1)}`);
        release();
        assert.equal(git("tag").trim(), "v1.0.0");
        assert.equal(JSON.parse(await readFile(path.join(repo, "npm-package/package.json"), "utf8")).version, "1.0.0");
        assert.ok((await readFile(path.join(repo, "release/semantic-golfer-1.0.0.tgz"))).length > 0);
        const sums = await readFile(path.join(repo, "release/SHA256SUMS"), "utf8");
        assert.equal(sums.trim().split("\n").length, 13);
        assert.match(sums, /^[a-f0-9]{64}  Semantic-Golfer-/);
        for (const name of ["latest.yml", "latest-mac.yml", "latest-linux.yml", "latest-linux-arm64.yml"]) {
            const metadata = JSON.parse(await readFile(path.join(repo, "release", name), "utf8"));
            assert.equal(metadata.version, "1.0.0");
            assert.equal(metadata.files.length, name === "latest-mac.yml" ? 4 : 2);
            for (const file of metadata.files) {
                const bytes = await readFile(path.join(repo, "release", file.url));
                assert.equal(file.size, bytes.length);
                assert.equal(file.sha512, createHash("sha512").update(bytes)
                    .digest("base64"));
            }
        }

        for (const [message, version] of [["docs: clarify setup", ""], ["fix: preserve selection", "1.0.1"],
            ["feat: add a game", "1.1.0"], ["feat!: change the document format", "2.0.0"]]) {
            git("commit", "--allow-empty", "-m", message!);
            git("push");
            await writeFile(env.GITHUB_OUTPUT, "");
            release("--dry-run");
            assert.equal(await readFile(env.GITHUB_OUTPUT, "utf8"), `version=${version}\n`);
        }
    } finally {
        await rm(temp, {recursive: true, force: true});
    }
});

test("GitHub publication includes download links, waits for every upload, and leaves failed uploads in a draft", async () => {
    // Exercise the installed plugin's publishing logic with a fake API; no GitHub requests are sent.
    const {default: publish} = await import(new URL("./lib/publish.js", import.meta.resolve("@semantic-release/github")).href);
    const config = JSON.parse(await readFile(new URL("../.releaserc.json", import.meta.url), "utf8"));
    const [, plugin] = config.plugins.find(([name]: [string]) => name === "@semantic-release/github");
    plugin.releaseBodyTemplate = getReleaseBodyTemplate("1.0.0", config.repositoryUrl);
    const temp = await mkdtemp(path.join(tmpdir(), "semantic-golfer-publish-"));
    const assets = [...getReleaseAssets("1.0.0"), "semantic-golfer-1.0.0.tgz", "SHA256SUMS",
        "latest.yml", "latest-mac.yml", "latest-linux.yml", "latest-linux-arm64.yml"];
    try {
        await mkdir(path.join(temp, "release"));
        for (const name of assets)
            await writeFile(path.join(temp, "release", name), `Test asset: ${name}`);
        for (const failUpload of [false, true]) {
            const gate = Promise.withResolvers<void>();
            const waiting = Promise.withResolvers<void>();
            const uploaded: string[] = [];
            let drafts = 0;
            let publications = 0;
            class Octokit {
                public async request(route: string | {name: string}, options?: {draft: boolean, body: string}) {
                    if (route === "POST /repos/{owner}/{repo}/releases") {
                        assert.equal(options?.draft, true);
                        const body = options!.body;
                        assert.ok(body.startsWith("## Downloads\n\n| OS | arm64 | x64 |\n| --- | --- | --- |\n"));
                        assert.ok(body.endsWith("\n\nTest release"), "keep the generated changelog below the table");
                        const downloads = [
                            ["macOS", "mac-arm64.dmg mac-arm64.zip", "mac-x64.dmg mac-x64.zip"],
                            ["Windows", "win-arm64.exe", "win-x64.exe"],
                            ["Linux", "linux-arm64.AppImage linux-arm64.deb linux-arm64.tar.gz",
                                "linux-x86_64.AppImage linux-amd64.snap linux-amd64.deb linux-x64.tar.gz"]
                        ];
                        for (const [os, ...columns] of downloads) {
                            const cells = columns.map((column) => column.split(" ").map((suffix) => {
                                const extension = suffix.slice(suffix.indexOf(".") + 1);
                                const url = "https://github.com/giladgd/semantic-golfer/releases/download/v1.0.0/" +
                                    `Semantic-Golfer-1.0.0-${suffix}`;
                                return `[${extension}](${url})`;
                            })
                                .join(" \\| "));
                            assert.ok(body.split("\n").includes(`| ${os} | ${cells.join(" | ")} |`), `${os} download columns`);
                        }
                        drafts++;
                        return {data: {id: 1, "upload_url": "https://uploads.example.test/1", "html_url": "https://example.test/draft"}};
                    }
                    if (typeof route === "object") {
                        if (route.name === assets.at(-1)) {
                            waiting.resolve();
                            await gate.promise;
                            if (failUpload)
                                throw new Error("Upload failed");
                        }
                        uploaded.push(route.name);
                        return {data: {"browser_download_url": `https://example.test/${route.name}`}};
                    }
                    assert.equal(route, "PATCH /repos/{owner}/{repo}/releases/{release_id}");
                    assert.equal(options?.draft, false);
                    assert.deepEqual(uploaded.sort(), [...assets].sort());
                    publications++;
                    return {data: {"html_url": "https://example.test/release"}};
                }
            }
            const publishing = publish(plugin, {
                cwd: temp, env: {}, options: {repositoryUrl: config.repositoryUrl},
                branch: {name: "master", type: "release", main: true},
                nextRelease: {gitTag: "v1.0.0", version: "1.0.0", notes: "Test release"},
                logger: {log() {}, error: assert.fail}
            }, {Octokit});
            const outcome = failUpload ? assert.rejects(publishing, /Upload failed/) : publishing;
            await Promise.race([waiting.promise, publishing]);
            assert.equal(drafts, 1);
            assert.equal(publications, 0, "the release must remain a draft while an upload is pending");
            gate.resolve();
            await outcome;
            assert.equal(publications, failUpload ? 0 : 1);
        }
    } finally {
        await rm(temp, {recursive: true, force: true});
    }
});
