import path from "node:path";
import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import {app, BrowserWindow, dialog, shell} from "electron";
import {AsyncDisposeAggregator, withLock} from "lifecycle-utils";
import {createModelDownloader, getLlama, type LlamaModel, type Llama, type LlamaDecisionContext, LlamaLogLevel} from "node-llama-cpp";
import {getModel, models, type ModelId, type DownloadableModelId} from "../../shared/models.ts";
import {createQuestion, validateDecisionRequest, type DecisionRequest, type DecisionResult} from "../../shared/decision.ts";
import {llmState} from "../state/llmState.ts";
import type {ModelState} from "../../shared/llmState.ts";

let llama: Llama | undefined;
let model: LlamaModel | undefined;
let context: LlamaDecisionContext | undefined;
let unloadPromise: Promise<void> | undefined;
const downloads = new Map<DownloadableModelId, AbortController>();
const localFiles = new Map<ModelId, string>();
const inferenceScope = [llmState, "inference"] as const;

function modelsDirectory() {
    return path.join(app.getPath("userData"), "models");
}

function modelPath(id: ModelId) {
    const local = localFiles.get(id);
    if (local != null)
        return local;
    getModel(id);
    return path.join(modelsDirectory(), `${id}.gguf`);
}

function updateModel(id: ModelId, update: Partial<ModelState>) {
    llmState.state = {
        ...llmState.state,
        models: {...llmState.state.models, [id]: {downloaded: false, ...llmState.state.models[id], ...update}}
    };
}

export async function discoverModels() {
    await Promise.all(models.map(async ({id}) => {
        const file = await fs.stat(modelPath(id)).catch(() => undefined);
        updateModel(id, {downloaded: file != null && file.isFile() && file.size > 0});
    }));
}

export function downloadModel(id: DownloadableModelId) {
    const selected = getModel(id);
    if (downloads.has(id) || llmState.state.models[id]?.downloaded || llmState.state.models[id]?.deleting)
        return;

    const controller = new AbortController();
    downloads.set(id, controller);
    updateModel(id, {error: undefined, download: {status: "downloading", downloadedSize: 0, totalSize: 0}});
    void (async () => {
        let downloader: Awaited<ReturnType<typeof createModelDownloader>> | undefined;
        try {
            let lastProgress = 0;
            downloader = await createModelDownloader({
                modelUri: selected.uri,
                dirPath: path.dirname(modelPath(id)),
                fileName: path.basename(modelPath(id)),
                onProgress({downloadedSize, totalSize, estimatedTimeLeft, averageSpeed}) {
                    if (controller.signal.aborted || (Date.now() - lastProgress < 100 && downloadedSize < totalSize))
                        return;
                    lastProgress = Date.now();
                    updateModel(id, {download: {
                        status: "downloading", downloadedSize, totalSize,
                        speed: Number.isFinite(averageSpeed) && averageSpeed >= 0 ? averageSpeed : undefined,
                        eta: averageSpeed > 0 && Number.isFinite(estimatedTimeLeft) ? estimatedTimeLeft : undefined
                    }});
                }
            });
            controller.signal.throwIfAborted();
            await downloader.download({signal: controller.signal});
            controller.signal.throwIfAborted();
            updateModel(id, {downloaded: true, download: undefined});
            if (llmState.state.loadedModelId == null && llmState.state.loading == null)
                void loadModel(id);
        } catch (error) {
            await downloader?.cancel().catch(console.error);
            updateModel(id, {download: undefined, error: controller.signal.aborted ? undefined : String(error)});
        } finally {
            downloads.delete(id);
        }
    })();
}

export function cancelDownload(id: DownloadableModelId) {
    getModel(id);
    const download = llmState.state.models[id]?.download;
    if (download == null)
        return;
    updateModel(id, {download: {...download, status: "canceling"}});
    downloads.get(id)?.abort();
}

export function loadModel(id: ModelId) {
    const filePath = modelPath(id);
    if (!llmState.state.models[id]?.downloaded)
        throw new Error("Download the model first.");
    if (llmState.state.models[id]?.deleting || llmState.state.loading != null || llmState.state.loadedModelId === id)
        return;

    llmState.state = {...llmState.state, loadedModelId: undefined, loading: {modelId: id, progress: 0, stage: "model"}, error: undefined};
    return withLock(inferenceScope, async () => {
        try {
            await unloadModel();
            llama ??= await getLlama({logLevel: LlamaLogLevel.error});
            model = await llama.loadModel({
                modelPath: filePath,
                onLoadProgress(progress) {
                    llmState.state = {...llmState.state, loading: {modelId: id, progress, stage: "model"}};
                }
            });
            llmState.state = {...llmState.state, loading: {modelId: id, progress: 1, stage: "context"}};
            context = await model.createDecisionContext({contextSize: {max: 4096}, parallelQuestions: 3});
            llmState.state = {...llmState.state, loading: {modelId: id, progress: 1, stage: "warmup"}};
            await context.warmup();
            llmState.state = {...llmState.state, loadedModelId: id, loading: undefined};
        } catch (error) {
            await unloadModel().catch((disposeError) => {
                error = disposeError;
            });
            llmState.state = {...llmState.state, loading: undefined, error: String(error)};
        }
    });
}

// Called only while holding inferenceScope, after any active decision finishes.
async function unloadModel() {
    llmState.state = {...llmState.state, loadedModelId: undefined};
    // Keep a failed disposal promise: native dispose() can return early on a second call.
    unloadPromise ??= new AsyncDisposeAggregator()
        .add(async () => {
            await context?.dispose();
        })
        .add(async () => {
            await model?.dispose();
        })
        .dispose()
        .catch((error) => {
            throw new Error(`Could not fully unload the model. Restart the app before loading another model. ${String(error)}`);
        });
    await unloadPromise;
    context = undefined;
    model = undefined;
    unloadPromise = undefined;
}

export async function evaluateDecision(request: DecisionRequest): Promise<DecisionResult> {
    modelPath(request?.modelId);
    const error = validateDecisionRequest(request);
    if (error != null)
        throw new Error(error);
    const inputs = [request.input, ...request.additionalInputs ?? []];
    const questions = Object.fromEntries(inputs.map((input, index) => [String(index), createQuestion(input)]));
    return await withLock(inferenceScope, async () => {
        if (context == null || llmState.state.loadedModelId !== request.modelId)
            throw new Error("The selected model is no longer loaded.");
        const start = performance.now();
        const answers = await context.decide(request.input.document, questions);
        return {
            answer: answers["0"]!,
            additionalAnswers: request.additionalInputs == null ? undefined :
                inputs.slice(1).map((_, index) => answers[String(index + 1)]!),
            duration: performance.now() - start
        };
    });
}

export async function selectModelFile(window: BrowserWindow) {
    const {canceled, filePaths} = await dialog.showOpenDialog(window, {
        title: "Select a model", filters: [{name: "GGUF models", extensions: ["gguf"]}], properties: ["openFile"]
    });
    if (canceled || filePaths[0] == null)
        return;
    const filePath = await fs.realpath(filePaths[0]);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size === 0 || path.extname(filePath).toLowerCase() !== ".gguf")
        throw new Error("Select a nonempty GGUF model file.");
    const downloaded = models.find(({id}) => modelPath(id) === filePath);
    if (downloaded != null) {
        updateModel(downloaded.id, {downloaded: true});
        return downloaded.id;
    }
    // Reopening the same file keeps its scores; replacing it creates a new identity.
    const id: ModelId = `local:${createHash("sha256").update(`${filePath}\0${stat.size}\0${stat.mtimeMs}`)
        .digest("hex")}`;
    localFiles.set(id, filePath);
    if (!llmState.state.localModels.some((model) => model.id === id))
        llmState.state = {...llmState.state, localModels: [...llmState.state.localModels, {id, name: path.basename(filePath)}]};
    updateModel(id, {downloaded: true});
    return id;
}

export async function openModelsDirectory() {
    await fs.mkdir(modelsDirectory(), {recursive: true});
    const error = await shell.openPath(modelsDirectory());
    if (error)
        throw new Error(error);
}

export async function deleteModel(id: DownloadableModelId) {
    getModel(id); // Only files managed by this app can be deleted.
    if (llmState.state.models[id]?.deleting || !llmState.state.models[id]?.downloaded || llmState.state.loading != null)
        return;
    // A queued model switch clears loadedModelId before this deletion acquires the lock.
    const wasLoaded = llmState.state.loadedModelId === id;
    updateModel(id, {deleting: true, error: undefined});
    try {
        await withLock(inferenceScope, async () => {
            if (wasLoaded || unloadPromise != null)
                await unloadModel();
            await fs.rm(modelPath(id), {force: true});
            updateModel(id, {downloaded: false});
        });
    } catch (error) {
        updateModel(id, {error: String(error)});
        throw error;
    } finally {
        updateModel(id, {deleting: false});
    }
}
