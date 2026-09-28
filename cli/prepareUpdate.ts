import {spawn, type ChildProcess} from "node:child_process";
import {once} from "node:events";
import {mkdir, mkdtemp, readFile, rename, rm, writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {homedir} from "node:os";
import {gt, prerelease, valid} from "semver";

// Match Electron's app-data location without loading Electron in the Node launcher.
function updatesDirectory() {
    const appData = process.platform === "darwin" ? path.join(homedir(), "Library", "Application Support") :
        process.platform === "win32" ? process.env.APPDATA ?? path.join(homedir(), "AppData", "Roaming") :
            process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config");
    return path.join(appData, "semantic-golfer", "updates");
}

function pointerFile(version: string) {
    return path.join(updatesDirectory(), prerelease(version) == null ? "stable.json" : "prerelease.json");
}

export async function savedUpdate(root: string) {
    try {
        const current = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
        if (!valid(current))
            return undefined;
        const version = JSON.parse(await readFile(pointerFile(current), "utf8")).version;
        if (!valid(version) || !gt(version, current) || (prerelease(version) != null) !== (prerelease(current) != null))
            return undefined;
        const updated = path.join(updatesDirectory(), `npm-${version}`, "node_modules", "semantic-golfer");
        const pkg = JSON.parse(await readFile(path.join(updated, "package.json"), "utf8"));
        return pkg.name === "semantic-golfer" && pkg.version === version ? updated : undefined;
    } catch {
        return undefined;
    }
}

async function runNode(args: string[], signal: AbortSignal, children: Set<ChildProcess>, env = process.env) {
    signal.throwIfAborted();
    const child = spawn(process.execPath, args, {env, signal, stdio: "inherit"});
    children.add(child);
    try {
        const [code] = await once(child, "exit");
        if (code !== 0)
            throw new Error("Could not prepare the new version. Check the terminal and try again.");
    } finally {
        children.delete(child);
    }
}

export async function prepareRuntime(root: string, signal: AbortSignal, children: Set<ChildProcess>) {
    await runNode([path.join(root, "dist-cli", "index.js")], signal, children, {...process.env, SEMANTIC_GOLFER_PREPARE_ONLY: "1"});
}

export async function prepareUpdate(version: string, signal: AbortSignal, children: Set<ChildProcess>) {
    if (!valid(version) || version !== valid(version))
        throw new Error("Invalid update request.");
    const npm = process.env.npm_execpath;
    if (!npm || !path.isAbsolute(npm))
        throw new Error("Start the app with npx semantic-golfer to install updates.");
    const target = path.join(updatesDirectory(), `npm-${version}`);
    // Install beside the running app; never mutate a global install or npm's npx cache.
    await mkdir(updatesDirectory(), {recursive: true});
    const staging = await mkdtemp(path.join(updatesDirectory(), ".npm-"));
    try {
        await runNode([npm, "install", "--prefix", staging, "--no-audit", "--no-fund", "--package-lock=false", "--omit=dev", `semantic-golfer@${version}`],
            signal, children);
        const root = path.join(staging, "node_modules", "semantic-golfer");
        const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
        if (pkg.name !== "semantic-golfer" || pkg.version !== version)
            throw new Error("The downloaded npm package does not match the requested update.");
        // Prepare the new native runtime in Node before closing the working app.
        await prepareRuntime(root, signal, children);
        signal.throwIfAborted();
        await rename(staging, target).catch(async (error: NodeJS.ErrnoException) => {
            if (error.code !== "EEXIST" && error.code !== "ENOTEMPTY")
                throw error;
            const existing = JSON.parse(await readFile(path.join(target, "node_modules", "semantic-golfer", "package.json"), "utf8"));
            if (existing.name !== "semantic-golfer" || existing.version !== version)
                throw new Error("The saved update is incomplete. Remove it and try again.");
        });
        const pointer = pointerFile(version);
        const temporary = `${pointer}.${randomUUID()}.tmp`;
        try {
            await writeFile(temporary, JSON.stringify({version}));
            await rename(temporary, pointer);
        } finally {
            await rm(temporary, {force: true});
        }
        return path.join(target, "node_modules", "semantic-golfer");
    } finally {
        await rm(staging, {recursive: true, force: true}).catch(() => {});
    }
}
