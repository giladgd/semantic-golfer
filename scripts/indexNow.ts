import {readFile, writeFile} from "node:fs/promises";

const key = process.env.INDEXNOW_KEY;
if (!key) {
    console.log("INDEXNOW_KEY is not configured; skipping IndexNow.");
} else {
    if (!/^[a-zA-Z0-9-]{8,128}$/.test(key))
        throw new Error("INDEXNOW_KEY must contain 8–128 letters, digits, or hyphens.");

    if (!process.argv.includes("--submit")) {
        await writeFile(new URL(`../dist-site/${key}.txt`, import.meta.url), key, "utf8");
        console.log("Added the IndexNow verification file to the website.");
    } else {
        const {homepage} = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
        const site = new URL(homepage);
        const response = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: {"Content-Type": "application/json; charset=utf-8"},
            body: JSON.stringify({
                host: site.host,
                key,
                keyLocation: new URL(`${key}.txt`, site).href,
                urlList: [site.href]
            }),
            signal: AbortSignal.timeout(30_000)
        });
        if (response.status !== 200 && response.status !== 202)
            throw new Error(`IndexNow submission failed: HTTP ${response.status}.`);
        console.log(response.status === 202 ? "IndexNow received the URL; key verification is pending." : "IndexNow accepted the URL.");
    }
}
