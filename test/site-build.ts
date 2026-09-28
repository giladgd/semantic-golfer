// Run after `npm run build:site`: `node --test test/site-build.ts`.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";
import sharp from "sharp";

test("the built site includes readable content, social metadata, and crawlable supporting files", async () => {
    const root = new URL("../dist-site/", import.meta.url);
    const html = await readFile(new URL("index.html", root), "utf8");
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    const canonical = pkg.homepage;
    const meta = (name: string) => html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))?.[1];
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
    assert.match(html, /<div id="root">[\s\S]*<h1[^>]*><span>Make every/);
    assert.match(html, /<title>Semantic Golfer/);
    const brand = html.match(/<a class="brand"[^>]*>([\s\S]*?)<\/a>/)![1]!;
    assert.match(brand, /^<svg\b[^>]*aria-hidden="true"/);
    assert.doesNotMatch(brand, /<img\b/);
    for (const text of ["Semantic Golfing", "Category Camouflage", "structured decisions", "Less text. More skill",
        "npx", "semantic-golfer", "yes-or-no", "Your text stays on your device", "No API key, no subscription"])
        assert.ok(html.includes(text), `Missing readable content: ${text}`);
    assert.ok(!html.includes("Small edits. Immediate feedback") && !html.includes("<details"));
    assert.ok(html.includes('<a class="plainTextGuide" href="./llms.txt" tabindex="-1">Plain-text guide</a>'));
    assert.equal(meta("og:url"), canonical);
    assert.equal(meta("og:type"), "website");
    assert.equal(meta("twitter:card"), "summary_large_image");
    assert.equal(meta("og:image"), `${canonical}assets/og-image.jpg`);
    assert.equal(meta("twitter:image"), meta("og:image"));
    assert.ok(meta("og:image:alt") && meta("twitter:image:alt"));
    assert.equal(meta("og:image:type"), "image/jpeg");
    assert.equal(meta("og:image:width"), "4096");
    assert.equal(meta("og:image:height"), "2048");
    assert.ok(!meta("robots")?.includes("noindex"));

    for (const [file, format] of [["og-image.jpg", "jpeg"], ["playground-preview.png", "png"]]) {
        const image = await readFile(new URL(`assets/${file}`, root));
        assert.deepEqual(image, await readFile(new URL(`../assets/${file}`, import.meta.url)));
        const metadata = await sharp(image).metadata();
        assert.equal(metadata.format, format);
        assert.equal(metadata.width, 4096);
        assert.equal(metadata.height, 2048);
        assert.ok(image.length < 1_000_000);
    }

    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]!);
    assert.equal(data["@type"], "SoftwareApplication");
    assert.equal(data.name, pkg.productName);
    assert.equal(data.url, canonical);
    assert.equal(data.image, meta("og:image"));
    assert.equal(data.offers.price, "0");
    assert.equal(data.aggregateRating, undefined);

    const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
    assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
    assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]), [canonical]);
    const robots = await readFile(new URL("robots.txt", root), "utf8");
    assert.ok(robots.includes(`Sitemap: ${canonical}sitemap.xml`));
    assert.ok(html.includes(`href="${canonical}sitemap.xml"`) && html.includes(`href="${canonical}llms.txt"`));
    const guide = await readFile(new URL("llms.txt", root), "utf8");
    for (const text of ["# Semantic Golfer", "npx semantic-golfer", "Semantic Golfing", "Category Camouflage",
        "noul", "choice", "score", "recorded evaluation durations", "Try it in real time", canonical])
        assert.ok(guide.includes(text), `Missing guide content: ${text}`);
    assert.ok(!html.includes("file://") && !html.includes("/home/node/"));
});

test("the source assets retain the lossless OG image and a 1280×640 social poster", async () => {
    for (const [file, width, height] of [["og-image.png", 4096, 2048], ["social.poster.png", 1280, 640]] as const) {
        const image = await sharp(await readFile(new URL(`../assets/${file}`, import.meta.url))).metadata();
        assert.equal(image.format, "png");
        assert.equal(image.width, width);
        assert.equal(image.height, height);
    }
});
