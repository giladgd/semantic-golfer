import type {ModelId} from "./models.ts";
import type {ScoreRecord} from "./scores.ts";
import type {AppUpdate} from "./appUpdate.ts";

export type DownloadState = {
    status: "downloading" | "canceling",
    downloadedSize: number,
    totalSize: number,
    speed?: number,
    eta?: number
};
export type ModelState = {downloaded: boolean, download?: DownloadState, deleting?: boolean, error?: string};
export type LlmState = {
    appVersion?: string,
    update?: AppUpdate,
    models: Partial<Record<ModelId, ModelState>>,
    localModels: Array<{id: ModelId, name: string}>,
    loadedModelId?: ModelId,
    loading?: {modelId: ModelId, progress: number, stage: "model" | "context" | "warmup"},
    error?: string,
    scores: ScoreRecord[],
    scoreError?: string
};

export const initialLlmState: LlmState = {models: {}, localModels: [], scores: []};

export function getDownloadProgress(state: LlmState) {
    const downloads = Object.values(state.models).flatMap((model) => (model?.download == null ? [] : [model.download]));
    const total = downloads.reduce((sum, download) => sum + download.totalSize, 0);
    return {
        count: downloads.length,
        progress: total > 0 && downloads.every((download) => download.totalSize > 0)
            ? downloads.reduce((sum, download) => sum + download.downloadedSize, 0) / total
            : undefined
    };
}
