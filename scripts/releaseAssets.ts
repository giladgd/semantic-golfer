import {archFromString, getArtifactArchName} from "builder-util";
import config from "../electron-builder.ts";

export function getReleaseAssets(version: string) {
    if (!/^\d+\.\d+\.\d+(?:-[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.test(version))
        throw new Error(`Invalid release version: ${version}`);

    return ["mac", "win", "linux"].flatMap((platform) => {
        const options = config[platform as "mac" | "win" | "linux"];
        return options.target.flatMap(({target, arch}) => {
            const extension = target === "nsis" ? "exe" : target;
            return arch.map((architecture) => config.artifactName
                .replace("${version}", version)
                .replace("${os}", platform)
                .replace("${arch}", getArtifactArchName(archFromString(architecture), extension))
                .replace("${ext}", extension));
        });
    });
}
