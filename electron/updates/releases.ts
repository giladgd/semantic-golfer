import {gt, prerelease, rcompare, valid} from "semver";

export const repository = "https://github.com/giladgd/semantic-golfer";
export type AppRelease = {version: string, tag: string};

export function selectRelease(data: unknown, currentVersion: string): AppRelease | undefined {
    if (!valid(currentVersion))
        throw new Error("The current app version is invalid.");
    const preview = prerelease(currentVersion) != null;
    const releases = Array.isArray(data) ? data : [data];
    const candidates: AppRelease[] = [];
    for (const release of releases) {
        if (release == null || typeof release !== "object" || release.draft !== false || release.prerelease !== preview ||
            typeof release.tag_name !== "string")
            continue;
        const version = valid(release.tag_name);
        if (version && (prerelease(version) != null) === preview && gt(version, currentVersion))
            candidates.push({version, tag: release.tag_name});
    }
    return candidates.sort((a, b) => rcompare(a.version, b.version))[0];
}

export async function findRelease(currentVersion: string) {
    const preview = prerelease(currentVersion) != null;
    let url: string | undefined = `https://api.github.com/repos/giladgd/semantic-golfer/releases${preview ? "?per_page=100" : "/latest"}`;
    while (url) {
        const response: Response = await fetch(url, {
            headers: {Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"},
            signal: AbortSignal.timeout(15_000)
        });
        if (response.status === 404)
            return undefined; // No release has been published yet.
        if (!response.ok)
            throw new Error(`GitHub update check failed (${response.status}). Try again later.`);
        const data: unknown = await response.json();
        const release = selectRelease(data, currentVersion);
        if (release || !preview)
            return release;
        const next = response.headers.get("link")?.match(/<([^>]+)>; rel="next"/)?.[1];
        url = next?.startsWith("https://api.github.com/repos/giladgd/semantic-golfer/releases?") ? next : undefined;
    }
    return undefined;
}
