import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {appendFile, readFile, readdir, stat, writeFile} from "node:fs/promises";
import semanticRelease from "semantic-release";
import {getReleaseAssets} from "./releaseAssets.ts";

const dryRun = process.argv.includes("--dry-run");
const config = JSON.parse(await readFile(new URL("../.releaserc.json", import.meta.url), "utf8"));
const expectedVersion = process.env.RELEASE_VERSION;
if (!dryRun && !expectedVersion)
    throw new Error("RELEASE_VERSION must match the version used by every platform build.");

// Resolve without the publishing plugin so a dry run cannot post comments or create releases.
const plan = await semanticRelease({...config, plugins: config.plugins.slice(0, 2), dryRun: true});
const version = plan ? plan.nextRelease.version : "";
if (dryRun) {
    if (process.env.GITHUB_OUTPUT)
        await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`);
    console.info(version ? `Next version: ${version}` : "No release needed.");
} else {
    if (version !== expectedVersion)
        throw new Error(`Release changed since the builds started: expected ${expectedVersion}, got ${version || "no release"}.`);

    const expectedAssets = getReleaseAssets(version);
    for (const name of expectedAssets) {
        if (!(await stat(`release/${name}`)).size)
            throw new Error(`Empty release artifact: ${name}`);
    }
    const assets = (await readdir("release")).filter((name) => name.startsWith("Semantic-Golfer-")).sort();
    const sums: string[] = [];
    const files: Array<{url: string, sha512: string, size: number}> = [];
    for (const name of assets) {
        if (!expectedAssets.includes(name) && !expectedAssets.some((asset) => name === `${asset}.blockmap`))
            throw new Error(`Unexpected release artifact: ${name}`);
        const hash = createHash("sha256");
        const updateHash = createHash("sha512");
        for await (const chunk of createReadStream(`release/${name}`)) {
            hash.update(chunk);
            updateHash.update(chunk);
        }
        sums.push(`${hash.digest("hex")}  ${name}`);
        if (expectedAssets.includes(name))
            files.push({url: name, sha512: updateHash.digest("base64"), size: (await stat(`release/${name}`)).size});
    }
    await writeFile("release/SHA256SUMS", sums.join("\n") + "\n");
    // Generate metadata once, after every build is ready. electron-updater requires these platform-specific filenames.
    const channels = {
        "latest.yml": /-win-(x64|arm64)\.exe$/,
        "latest-mac.yml": /-mac-(x64|arm64)\.(zip|dmg)$/,
        "latest-linux.yml": /-linux-(x86_64\.AppImage|amd64\.deb)$/,
        "latest-linux-arm64.yml": /-linux-arm64\.(AppImage|deb)$/
    };
    for (const [name, pattern] of Object.entries(channels)) {
        // JSON is valid YAML, avoiding a separate serializer for the updater manifests.
        await writeFile(`release/${name}`, JSON.stringify({version, releaseDate: new Date().toISOString(),
            files: files.filter(({url}) => pattern.test(url))}, null, 2) + "\n");
    }
    // semantic-release publishes plugins in order: npm must succeed before GitHub uploads or publication.
    await semanticRelease(config);
}
