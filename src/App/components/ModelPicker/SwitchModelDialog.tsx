import {useEffect, useId, useRef} from "react";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {answerModelSwitch, modelSwitchState} from "../../../state/modelSelectionState.ts";
import "./SwitchModelDialog.css";

export function SwitchModelDialog() {
    const pending = useExternalState(modelSwitchState);
    const dialog = useRef<HTMLDialogElement>(null);
    const descriptionId = useId();
    useEffect(() => {
        if (pending != null)
            dialog.current?.showModal();
        else
            dialog.current?.close();
    }, [pending]);
    return <dialog
        className="switchModelDialog"
        ref={dialog}
        aria-label="Switch model"
        aria-describedby={descriptionId}
        onCancel={() => answerModelSwitch(false)}
    >
        <p id={descriptionId}>Switching a model now will stop the current play round. Are you sure?</p>
        <div className="dialogActions">
            <button autoFocus onClick={() => answerModelSwitch(false)}>Cancel</button>
            <button className="confirmSwitch" onClick={() => answerModelSwitch(true)}>Switch model</button>
        </div>
    </dialog>;
}
