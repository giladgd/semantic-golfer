import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import {setTimeout} from "node:timers/promises";

test("the launcher prepares/disposes llama before Electron and closes the child on interruption", {timeout: 30_000}, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "semantic-golfer-launcher-"));
    try {
        await mkdir(path.join(root, "dist-cli"));
        await cp(new URL("../cli/index.ts", import.meta.url), path.join(root, "dist-cli/index.ts"));
        const helper = await readFile(new URL("../cli/prepareUpdate.ts", import.meta.url), "utf8");
        await writeFile(path.join(root, "dist-cli/prepareUpdate.ts"), helper.replaceAll("homedir()", "process.env.UPDATE_HOME"));
        await writeFile(path.join(root, "package.json"), JSON.stringify({type: "module", version: "1.0.0", main: "app.js"}));
        await writeFile(path.join(root, "app.js"), `
            import {appendFileSync} from "node:fs";
            if (process.env.SEMANTIC_GOLFER_LAUNCHER !== "1" || !process.connected) process.exit(1);
            appendFileSync(process.env.TRACE, "electron\\n");
            console.log("ready");
            process.once("disconnect", () => process.exit(0));
            if (process.env.SCENARIO.startsWith("update")) {
                process.send({type: "semantic-golfer:update", version: "1.1.0", directory: process.env.UPDATE_ROOT});
                process.on("message", message => {
                    if (message.type === "semantic-golfer:update-ready") {
                        appendFileSync(process.env.TRACE, "old closed\\n");
                        process.exit(0);
                    } else if (message.type === "semantic-golfer:update-error") {
                        appendFileSync(process.env.TRACE, "update rejected\\n");
                        process.exit(7);
                    }
                });
            } else if (process.env.SCENARIO === "exit") setTimeout(() => process.exit(7), 20);
            else setInterval(() => {}, 1000);
        `);
        for (const name of ["electron", "node-llama-cpp"])
            await mkdir(path.join(root, "node_modules", name), {recursive: true});
        await symlink(path.dirname(createRequire(import.meta.url).resolve("semver/package.json")), path.join(root, "node_modules/semver"), "junction");
        await writeFile(path.join(root, "node_modules/electron/index.js"), "module.exports = process.execPath;");
        await writeFile(path.join(root, "node_modules/node-llama-cpp/package.json"), '{"type":"module","exports":"./index.js"}');
        await writeFile(path.join(root, "node_modules/node-llama-cpp/index.js"), `
            import assert from "node:assert/strict";
            import {appendFileSync} from "node:fs";
            export async function getLlama(...args) {
                assert.equal(args.length, 0);
                appendFileSync(process.env.TRACE, "prepare\\n");
                if (process.env.SCENARIO === "fail") throw Error("preparation failed");
                return {async dispose() {
                    await new Promise(resolve => setTimeout(resolve, 20));
                    appendFileSync(process.env.TRACE, "disposed\\n");
                }};
            }
        `);
        const npm = path.join(root, "npm-fixture.js");
        await writeFile(npm, `
            import {appendFileSync, mkdirSync, writeFileSync} from "node:fs";
            import path from "node:path";
            appendFileSync(process.env.TRACE, "install\\n");
            if (process.env.SCENARIO === "update-install-fail") process.exit(2);
            const target = process.argv[process.argv.indexOf("--prefix") + 1];
            const pkg = path.join(target, "node_modules/semantic-golfer");
            mkdirSync(path.join(pkg, "dist-cli"), {recursive: true});
            writeFileSync(path.join(pkg, "package.json"), JSON.stringify({
                name: "semantic-golfer", version: "1.1.0", type: "module", main: "app.js"
            }));
            writeFileSync(path.join(pkg, "dist-cli/index.js"), \`
                import {appendFileSync} from "node:fs";
                if (process.env.SEMANTIC_GOLFER_PREPARE_ONLY !== "1") process.exit(1);
                appendFileSync(process.env.TRACE, "prepared new\\\\n");
                if (process.env.SCENARIO === "update-prepare-fail") process.exit(2);
            \`);
            writeFileSync(path.join(pkg, "app.js"), \`
                import {appendFileSync} from "node:fs";
                appendFileSync(process.env.TRACE, "updated\\\\n");
                process.exit(7);
            \`);
        `);
        // Windows task termination does not dispatch POSIX signals to the launcher.
        const scenarios = ["exit", "fail", "update", "update-install-fail", "update-prepare-fail"];
        if (process.platform !== "win32")
            scenarios.push("SIGINT", "SIGTERM");
        for (const scenario of scenarios) {
            const trace = path.join(root, `${scenario}.txt`);
            const data = path.join(root, scenario, "updates with spaces");
            const env = {...process.env, TRACE: trace, SCENARIO: scenario, "npm_execpath": npm,
                UPDATE_HOME: data, APPDATA: data, XDG_CONFIG_HOME: data};
            const child = spawn(process.execPath, [path.join(root, "dist-cli/index.ts")], {
                env,
                stdio: ["ignore", "pipe", "pipe"]
            });
            const exited = once(child, "exit");
            let stdout = "";
            child.stdout.on("data", (chunk) => {
                stdout += chunk;
            });
            child.stderr.resume();
            try {
                if (scenario.startsWith("SIG")) {
                    for (let attempt = 0; !stdout.includes("ready") && attempt < 100; attempt++)
                        await setTimeout(20);
                    assert.ok(stdout.includes("ready"), "Electron must start after preparing the runtime");
                    child.kill(scenario as NodeJS.Signals);
                }
                const [code, signal] = await exited;
                assert.equal(signal, null);
                assert.equal(code, scenario === "exit" || scenario.startsWith("update") ? 7 : scenario === "SIGINT" ? 130 : scenario === "SIGTERM" ? 143 : 1);
                const updated = scenario === "update" ? "install\nprepared new\nold closed\nupdated\n" :
                    scenario === "update-install-fail" ? "install\nupdate rejected\n" :
                        scenario === "update-prepare-fail" ? "install\nprepared new\nupdate rejected\n" : "";
                assert.equal(await readFile(trace, "utf8"), scenario === "fail" ? "prepare\n" : `prepare\ndisposed\nelectron\n${updated}`);
                if (scenario === "update") {
                    await writeFile(trace, "");
                    const relaunched = spawn(process.execPath, [path.join(root, "dist-cli/index.ts")], {env, stdio: "ignore"});
                    assert.equal((await once(relaunched, "exit"))[0], 7);
                    assert.equal(await readFile(trace, "utf8"), "prepare\ndisposed\nprepared new\nupdated\n");
                    const appData = process.platform === "darwin" ? path.join(data, "Library", "Application Support") : data;
                    await rm(path.join(appData, "semantic-golfer/updates/npm-1.1.0/node_modules/semantic-golfer/dist-cli/index.js"));
                    await writeFile(trace, "");
                    const fallback = spawn(process.execPath, [path.join(root, "dist-cli/index.ts")], {
                        env: {...env, SCENARIO: "exit"}, stdio: "ignore"
                    });
                    assert.equal((await once(fallback, "exit"))[0], 7);
                    assert.equal(await readFile(trace, "utf8"), "prepare\ndisposed\nelectron\n");
                }
            } finally {
                child.kill();
            }
        }
    } finally {
        await rm(root, {recursive: true, force: true});
    }
});
