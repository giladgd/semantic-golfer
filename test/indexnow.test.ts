import assert from "node:assert/strict";
import {cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {test} from "node:test";
import {pathToFileURL} from "node:url";

test("IndexNow publishes the key, submits the canonical URL, and handles missing keys and API errors", async (context) => {
    const root = await mkdtemp(path.join(tmpdir(), "semantic-golfer-indexnow-"));
    const originalKey = process.env.INDEXNOW_KEY;
    const originalArgs = process.argv;
    context.after(async () => {
        if (originalKey == null)
            delete process.env.INDEXNOW_KEY;
        else
            process.env.INDEXNOW_KEY = originalKey;
        process.argv = originalArgs;
        await rm(root, {recursive: true, force: true});
    });
    await mkdir(path.join(root, "scripts"));
    await mkdir(path.join(root, "dist-site"));
    const homepage = "https://semantic-golfer.giladgd.com";
    await writeFile(path.join(root, "package.json"), JSON.stringify({type: "module", homepage}));
    const script = path.join(root, "scripts/indexNow.ts");
    await cp(new URL("../scripts/indexNow.ts", import.meta.url), script);
    let runId = 0;
    const run = () => import(`${pathToFileURL(script).href}?run=${runId++}`);
    let status = 200;
    const request = context.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
        assert.equal(url, "https://api.indexnow.org/indexnow");
        assert.equal(options?.method, "POST");
        assert.deepEqual(JSON.parse(String(options?.body)), {
            host: "semantic-golfer.giladgd.com", key: process.env.INDEXNOW_KEY,
            keyLocation: `${homepage}/${process.env.INDEXNOW_KEY}.txt`, urlList: [`${homepage}/`]
        });
        assert.ok(options?.signal instanceof AbortSignal);
        return new Response(null, {status});
    });
    delete process.env.INDEXNOW_KEY;
    process.argv = [process.execPath, script];
    await run();
    process.argv.push("--submit");
    await run();
    assert.equal(request.mock.callCount(), 0);
    process.argv.pop();
    for (const key of ["short", "../invalid-key", "x".repeat(129)]) {
        process.env.INDEXNOW_KEY = key;
        await assert.rejects(run(), /INDEXNOW_KEY must contain/);
    }
    assert.deepEqual(await readdir(path.join(root, "dist-site")), []);
    process.env.INDEXNOW_KEY = "0123456789abcdef0123456789abcdef";
    await run();
    assert.equal(await readFile(path.join(root, "dist-site", `${process.env.INDEXNOW_KEY}.txt`), "utf8"), process.env.INDEXNOW_KEY);
    assert.equal(request.mock.callCount(), 0, "Building the website must not submit URLs");
    process.argv.push("--submit");
    await run();
    status = 202;
    await run();
    for (status of [403, 429, 500])
        await assert.rejects(run(), new RegExp(`HTTP ${status}`));
    assert.equal(request.mock.callCount(), 5);
});
