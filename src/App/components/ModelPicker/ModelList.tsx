import {useRef, useState} from "react";
import prettyMilliseconds from "pretty-ms";
import {models, type DownloadableModelId, type ModelId} from "../../../../shared/models.ts";
import {electronLlmRpc} from "../../../rpc/llmRpc.ts";
import {selectModel} from "../../../state/modelSelectionState.ts";
import {DownloadIconSVG} from "../../../icons/DownloadIconSVG.tsx";
import {CheckIconSVG} from "../../../icons/CheckIconSVG.tsx";
import {DeleteIconSVG} from "../../../icons/DeleteIconSVG.tsx";
import {GgufIconSVG} from "../../../icons/GgufIconSVG.tsx";
import {FolderIconSVG} from "../../../icons/FolderIconSVG.tsx";
import {FileIconSVG} from "../../../icons/FileIconSVG.tsx";
import {ProgressBar} from "../ProgressBar/ProgressBar.tsx";
import {DeleteModelDialog} from "./DeleteModelDialog.tsx";
import "./ModelList.css";
import type {LlmState} from "../../../../shared/llmState.ts";

export function ModelList({state}: {state: LlmState}) {
    const [error, setError] = useState<string>();
    const [selecting, setSelecting] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<DownloadableModelId>();
    const deleteDialog = useRef<HTMLDialogElement>(null);

    function act(action: Promise<unknown>) {
        setError(undefined);
        return action.catch((error) => setError(String(error)));
    }

    function progress(id: ModelId) {
        const download = state.models[id]?.download;
        const loading = state.loading?.modelId === id ? state.loading : undefined;
        if (download != null) {
            const value = download.totalSize > 0 ? download.downloadedSize / download.totalSize : undefined;
            return <div className="modelProgress">
                <div>
                    <span>{value == null ? "Connecting…" : `${Math.floor(value * 100)}%`}
                        {value != null && download.speed != null && ` · ${(download.speed / 1_000_000).toFixed(1)} MB/s`}
                    </span>
                    <span>{download.status === "canceling" ? "Canceling…" :
                        download.eta == null ? "Estimating…" : `${prettyMilliseconds(download.eta, {compact: true})} left`}
                    </span>
                </div>
                <ProgressBar value={value} label={`${id} download`} />
            </div>;
        }
        if (loading != null)
            return <div className="modelProgress"><span>{loading.stage === "model" ? `Loading ${Math.round(loading.progress * 100)}%` :
                loading.stage === "context" ? "Preparing context…" : "Warming up…"}
            </span>
            <ProgressBar value={loading.stage === "model" ? loading.progress : undefined} label={`Loading ${id}`} />
            </div>;
        return null;
    }

    return <div className="modelList" aria-label="Models">
        <div className="modelRows">{models.map((model) => {
            const local = state.models[model.id];
            const active = state.loadedModelId === model.id;
            const recommended = model.id === "gemma-q8";
            const name = `${model.name} ${model.parameters}`;
            return <article className="modelRow" key={model.id} data-active={active}>
                <div className="modelRowMain">
                    <button
                        className="modelSelect"
                        disabled={active || local?.download != null || local?.deleting ||
                        (local?.downloaded && state.loading != null)}
                        aria-label={`${active ? "Loaded" : local?.downloaded ? "Load" : "Download"} ${name} ${model.quant}`}
                        aria-description={recommended ? "Our pick" : undefined}
                        onClick={() => void act(local?.downloaded
                            ? selectModel(model.id) : electronLlmRpc.downloadModel(model.id))}
                    >
                        <span className="modelIcon">{active ? <CheckIconSVG /> : local?.downloaded ? <GgufIconSVG /> : <DownloadIconSVG />}</span>
                        <span className="modelDetails"><span className="modelName">{name}</span>
                            <span className="modelMeta">
                                <span className="modelTag">{model.quant}</span><span className="modelTag">{model.size}</span>
                                {recommended && <span className="modelTag ourPick">Our pick</span>}
                            </span>
                        </span>
                    </button>
                    {local?.download != null ? <button
                        className="cancelDownload"
                        disabled={local.download.status === "canceling"}
                        onClick={() => void act(electronLlmRpc.cancelDownload(model.id))}
                        aria-label={`Cancel ${name} download`}
                    >Cancel
                    </button> :
                        local?.downloaded && <button
                            className="deleteModel"
                            disabled={local.deleting || state.loading != null}
                            onClick={() => {
                                setModelToDelete(model.id);
                                deleteDialog.current?.showModal();
                            }}
                            aria-label={`Delete ${name} ${model.quant}`}
                            title="Delete model"
                        >
                            <DeleteIconSVG />
                        </button>}
                </div>
                {progress(model.id)}
                {local?.error != null && <div className="error" role="alert">{local.error}</div>}
            </article>;
        })}
        {state.localModels.map((model) => <article className="modelRow" key={model.id} data-active={state.loadedModelId === model.id}>
            <button
                className="modelSelect"
                disabled={state.loadedModelId === model.id || state.loading != null}
                onClick={() => void act(selectModel(model.id))}
                title={model.name}
            >
                <span className="modelIcon">{state.loadedModelId === model.id ? <CheckIconSVG /> : <GgufIconSVG />}</span>
                <span className="modelDetails"><span className="modelName">{model.name}</span>
                    <span className="modelMeta"><span className="modelTag">Local file</span></span>
                </span>
            </button>{progress(model.id)}
        </article>)}
        </div>
        <div className="fileActions">
            <button
                disabled={selecting || state.loading != null}
                onClick={() => {
                    setSelecting(true);
                    void act(electronLlmRpc.selectModelFile().then((modelId) => {
                        if (modelId != null)
                            return selectModel(modelId);
                        return undefined;
                    })).finally(() => setSelecting(false));
                }}
            ><FileIconSVG />Select model file…
            </button>
            <button onClick={() => void act(electronLlmRpc.openModelsDirectory())}><FolderIconSVG />Models folder</button>
        </div>
        {(error ?? state.error) != null && <div className="error" role="alert">{error ?? state.error}</div>}
        <DeleteModelDialog
            dialogRef={deleteDialog}
            modelId={modelToDelete}
            disabled={state.loading != null || modelToDelete == null || !state.models[modelToDelete]?.downloaded}
        />
    </div>;
}
