import {archFromString, getArtifactArchName} from "builder-util";
import config from "../electron-builder.ts";

const platforms = {mac: "macOS", win: "Windows", linux: "Linux"};

export function getReleaseAssets(version: string) {
    return getReleaseArtifacts(version).map(({name}) => name);
}

export function getReleaseBodyTemplate(version: string, repositoryUrl: string) {
    const artifacts = getReleaseArtifacts(version);
    const releaseUrl = `${repositoryUrl.replace(/\.git$/, "")}/releases/download/\${nextRelease.gitTag}`;
    const rows = Object.entries(platforms).map(([platform, label]) => {
        const cells = ["arm64", "x64"].map((architecture) => artifacts
            .filter((artifact) => artifact.platform === platform && artifact.architecture === architecture)
            .map(({name, extension}) => `[${extension}](${releaseUrl}/${name})`)
            .join(" \\| "));
        return `| ${label} | ${cells.join(" | ")} |`;
    });
    return ["## Downloads", "", "|  | arm64 | x64 |", "| --- | --- | --- |", ...rows, "", "${nextRelease.notes}"].join("\n");
}

function getReleaseArtifacts(version: string) {
    if (!/^\d+\.\d+\.\d+(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.test(version))
        throw new Error(`Invalid release version: ${version}`);

    return Object.keys(platforms).flatMap((platform) => {
        const options = config[platform as "mac" | "win" | "linux"];
        return options.target.flatMap(({target, arch}) => {
            const extension = target === "nsis" ? "exe" : target;
            return arch.map((architecture) => ({
                platform, architecture, extension,
                name: config.artifactName
                    .replace("${version}", version)
                    .replace("${os}", platform)
                    .replace("${arch}", getArtifactArchName(archFromString(architecture), extension))
                    .replace("${ext}", extension)
            }));
        });
    });
}
