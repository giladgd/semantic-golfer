import {useEffect, useRef, useState} from "react";
import {models} from "../../../../shared/models.ts";
import {getDownloadProgress, type LlmState} from "../../../../shared/llmState.ts";
import {GgufIconSVG} from "../../../icons/GgufIconSVG.tsx";
import {ChevronDownIconSVG} from "../../../icons/ChevronDownIconSVG.tsx";
import {ProgressBar} from "../ProgressBar/ProgressBar.tsx";
import {ModelList} from "./ModelList.tsx";
import {SwitchModelDialog} from "./SwitchModelDialog.tsx";
import "./ModelPicker.css";

export function ModelPicker({state}: {state: LlmState}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const popover = useRef<HTMLDivElement>(null);
    const loading = state.loading != null;
    const noModel = state.loadedModelId == null;
    const [required, setRequired] = useState(noModel);
    // Keep the picker in place while the previous model is unloaded and its replacement loads.
    if (!loading && required !== noModel)
        setRequired(noModel);
    const modelId = state.loading?.modelId ?? state.loadedModelId;
    const loaded = models.find((model) => model.id === modelId);
    const name = loaded == null ? state.localModels.find((model) => model.id === modelId)?.name :
        `${loaded.name} ${loaded.parameters}`;
    const downloads = getDownloadProgress(state);

    useEffect(() => {
        if (required) {
            popover.current?.hidePopover();
            dialog.current?.showModal();
        } else {
            dialog.current?.close();
            if (loading)
                popover.current?.showPopover();
        }
    }, [required, loading]);

    return <div className="modelPicker">
        <div className="modelButtonArea" hidden={required}>
            <button className="modelButton" popoverTarget="modelsPopover" title={name} aria-label={`Models: ${name ?? "Get a model"}`}>
                <GgufIconSVG /><span className="modelButtonName">{name ?? "Get a model"}</span><ChevronDownIconSVG />
            </button>
            {downloads.count > 0 && <ProgressBar value={downloads.progress} label="Total download progress" />}
        </div>
        <div className="modelsPopover" id="modelsPopover" popover="auto" ref={popover}>
            <ModelList state={state} />
        </div>
        <dialog
            className="requiredPicker"
            ref={dialog}
            onCancel={(event) => {
                if (event.target === event.currentTarget)
                    event.preventDefault();
            }}
            aria-labelledby="pickModelHeading"
        >
            <h1 id="pickModelHeading">Pick a model</h1>
            <ModelList state={state} />
        </dialog>
        <SwitchModelDialog />
    </div>;
}
