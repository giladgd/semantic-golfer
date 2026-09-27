import {useId, useState, type RefObject} from "react";
import {models, type DownloadableModelId} from "../../../../shared/models.ts";
import {electronLlmRpc} from "../../../rpc/llmRpc.ts";
import "./DeleteModelDialog.css";

export function DeleteModelDialog({dialogRef, modelId, disabled}: {
    dialogRef: RefObject<HTMLDialogElement | null>, modelId?: DownloadableModelId, disabled: boolean
}) {
    const headingId = useId();
    const descriptionId = useId();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string>();
    const model = models.find((model) => model.id === modelId);

    async function confirmDelete() {
        if (modelId == null || disabled || deleting)
            return;
        setDeleting(true);
        setError(undefined);
        try {
            await electronLlmRpc.deleteModel(modelId);
            dialogRef.current?.close();
        } catch (error) {
            setError(String(error));
        } finally {
            setDeleting(false);
        }
    }

    return <dialog
        className="deleteModelDialog"
        ref={dialogRef}
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        aria-busy={deleting}
        onClose={() => setError(undefined)}
        onCancel={(event) => {
            if (deleting)
                event.preventDefault();
        }}
    >
        <h2 id={headingId}>Delete {model == null ? "model" : `${model.name} ${model.parameters}`}?</h2>
        <p id={descriptionId}>You can always download the model again</p>
        {error != null && <div className="deleteError" role="alert">{error}</div>}
        <div className="dialogActions">
            <button autoFocus disabled={deleting} onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button className="confirmDelete" disabled={disabled || deleting} onClick={() => void confirmDelete()}>
                {deleting ? "Deleting…" : "Delete model"}
            </button>
        </div>
    </dialog>;
}
