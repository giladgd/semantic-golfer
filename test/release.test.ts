import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import {fileURLToPath, pathToFileURL} from "node:url";
import {getReleaseAssets} from "../scripts/releaseAssets.ts";

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
        await writeFile(path.join(repo, ".gitignore"), "node_modules\nrelease\n");
        await symlink(path.join(root, "node_modules"), path.join(repo, "node_modules"), "junction");
        await cp(path.join(root, "scripts"), path.join(repo, "scripts"), {recursive: true});
        await cp(path.join(root, "electron-builder.ts"), path.join(repo, "electron-builder.ts"));
        const config = JSON.parse(await readFile(path.join(root, ".releaserc.json"), "utf8"));
        config.repositoryUrl = pathToFileURL(remote).href;
        config.ci = false;
        // Exercise actual tags/releases against a disposable local remote, without any GitHub calls.
        config.plugins = config.plugins.slice(0, 2);
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
        for (const asset of assets)
            await writeFile(path.join(repo, "release", asset), `Test build: ${asset}`);
        release();
        assert.equal(git("tag").trim(), "v1.0.0");
        const sums = await readFile(path.join(repo, "release/SHA256SUMS"), "utf8");
        assert.equal(sums.trim().split("\n").length, 13);
        assert.match(sums, /^[a-f0-9]{64}  Semantic-Golfer-/);

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
