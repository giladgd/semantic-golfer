import {fileURLToPath} from "node:url";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
    root: fileURLToPath(new URL("./", import.meta.url)),
    base: "./",
    publicDir: fileURLToPath(new URL("../public", import.meta.url)),
    build: {
        outDir: fileURLToPath(new URL("../dist-site", import.meta.url)),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                // Keep the screenshot URL stable for social metadata and structured data.
                assetFileNames: (asset) => (asset.names.includes("playground-preview.png")
                    ? "assets/[name][extname]" : "assets/[name]-[hash][extname]")
            }
        }
    },
    plugins: [react({babel: {plugins: ["babel-plugin-react-compiler"]}}), svgr()],
    resolve: {
        alias: [{
            // Keep the app unchanged; only the website's transport uses recorded decisions.
            find: /^(?:\.\.\/)+utils\/createRendererSideBirpc\.ts$/,
            replacement: fileURLToPath(new URL("./demo/recordedRpc.ts", import.meta.url))
        }]
    }
});
