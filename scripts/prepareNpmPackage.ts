import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {getModuleVersion} from "node-llama-cpp";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const llamaVersion = await getModuleVersion();

const output = new URL("npm-package/", root);
await rm(output, {recursive: true, force: true});
await mkdir(output);
for (const name of pkg.files)
    await cp(new URL(name, root), new URL(name, output), {recursive: true});

await writeFile(new URL("package.json", output), JSON.stringify({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: "module",
    main: pkg.main,
    bin: {[pkg.name]: "dist-cli/index.js"},
    files: pkg.files,
    license: pkg.license,
    author: pkg.author,
    repository: pkg.repository,
    homepage: pkg.homepage,
    bugs: pkg.bugs,
    funding: pkg.funding,
    engines: pkg.engines,
    publishConfig: {access: "public"},
    dependencies: {
        electron: pkg.devDependencies.electron,
        "electron-updater": pkg.dependencies["electron-updater"],
        semver: pkg.dependencies.semver,
        "node-llama-cpp": llamaVersion,
        "lifecycle-utils": pkg.dependencies["lifecycle-utils"]
    }
}, null, 2) + "\n");
console.info(`Prepared ${pkg.name} with node-llama-cpp ${llamaVersion} in ${fileURLToPath(output)}`);
