import {cp, readFile, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {build} from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = path.join(root, ".site-render");
const configFile = path.join(root, "site/vite.config.ts");

try {
    await build({configFile});
    await build({configFile, build: {ssr: path.join(root, "site/render.tsx"), outDir: temporary, copyPublicDir: false}});
    const {render} = await import(pathToFileURL(path.join(temporary, "render.js")).href);
    const output = path.join(root, "dist-site");
    const htmlPath = path.join(output, "index.html");
    const html = await readFile(htmlPath, "utf8");
    await writeFile(htmlPath, html.replace('<div id="root"></div>', () => `<div id="root">${render()}</div>`));
    for (const file of ["sitemap.xml", "robots.txt", "llms.txt"])
        await cp(path.join(root, "site", file), path.join(output, file));
    await cp(path.join(root, "assets/og-image.jpg"), path.join(output, "assets/og-image.jpg"));
} finally {
    await rm(temporary, {recursive: true, force: true});
}
