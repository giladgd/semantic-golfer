import {type KeyboardEvent} from "react";
import {flushSync} from "react-dom";
import {decisionTypes, getDecisionCriteria, maxCriteria, validateDecisionInput} from "../../../../shared/decision.ts";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {llmState} from "../../../state/llmState.ts";
import {decisionRunner, decisionState, updateInput} from "../../../state/decisionState.ts";
import {CriteriaEditor} from "../CriteriaEditor/CriteriaEditor.tsx";
import {DocumentInput} from "../DocumentInput/DocumentInput.tsx";
import {DecisionResult} from "../DecisionResult/DecisionResult.tsx";
import "./Playground.css";

export function Playground() {
    const llm = useExternalState(llmState);
    const editor = useExternalState(decisionState);
    const evaluation = useExternalState(decisionRunner.state);
    const input = editor.drafts[editor.type];
    const ready = llm.loadedModelId != null;

    function onEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement) || target.selectionStart !== target.selectionEnd ||
            event.defaultPrevented || event.nativeEvent.isComposing || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey ||
            !["Enter", "Backspace", "ArrowUp", "ArrowDown", "Escape"].includes(event.key))
            return;

        const container = event.currentTarget;
        const atStart = target.selectionStart === 0;
        const atEnd = target.selectionStart === target.value.length;
        let nextId: string | undefined;
        let position: "start" | "end" | undefined;

        if (target.id === "documentText") {
            if (event.key === "Escape")
                nextId = "decisionQuestion";
        } else if (target.id === "decisionQuestion") {
            if (event.key === "Escape")
                nextId = "documentText";
            else if (atEnd && (event.key === "Enter" || event.key === "ArrowDown")) {
                nextId = "criterion-0";
                position = "start";
            }
        } else {
            const fields = [...container.querySelectorAll(".criterion textarea")];
            const index = fields.indexOf(target);
            const criteria = getDecisionCriteria(input);
            if (index < 0)
                return;
            if (event.key === "Escape")
                nextId = "documentText";
            else if (event.key === "ArrowUp" && atStart) {
                nextId = index === 0 ? "decisionQuestion" : `criterion-${index - 1}`;
                position = "end";
            } else if (event.key === "ArrowDown" && atEnd && index < fields.length - 1) {
                nextId = `criterion-${index + 1}`;
                position = "start";
            } else if (event.key === "Enter" && atEnd && input.type !== "noul" && criteria.length < maxCriteria[input.type]) {
                if (index < criteria.length - 1)
                    flushSync(() => updateInput({...input, criteria: [
                        ...criteria.slice(0, index + 1), "", ...criteria.slice(index + 1)
                    ]}));
                else if (index === fields.length - 1) {
                    if (fields.length >= maxCriteria[input.type])
                        return;
                    flushSync(() => updateInput({...input, criteria: [...input.criteria.slice(0, index), target.value, ""]}));
                }
                nextId = `criterion-${index + 1}`;
                position = "start";
            } else if (event.key === "Backspace" && target.value === "" && input.type !== "noul" &&
                (criteria.length > 2 || (index >= criteria.length && index > 0))) {
                if (index < input.criteria.length)
                    flushSync(() => updateInput({...input, criteria: input.criteria.filter((_, i) => i !== index)}));
                nextId = `criterion-${Math.max(0, index - 1)}`;
                position = index === 0 ? "start" : "end";
            }
        }

        if (nextId != null) {
            event.preventDefault();
            const next = container.querySelector<HTMLTextAreaElement>(`#${nextId}`);
            next?.focus();
            if (next != null && position != null) {
                const caret = position === "end" ? next.value.length : 0;
                next.setSelectionRange(caret, caret);
            }
        }
    }

    return <section className="playground" aria-label="Decision playground">
        <div className="workspaceToolbar">
            <div className="typeSwitch" role="group" aria-label="Decision type">
                {decisionTypes.map((type) => <button
                    key={type}
                    aria-pressed={editor.type === type}
                    onClick={() => {
                        decisionState.state = {...editor, type};
                    }}
                >
                    {type}
                </button>)}
            </div>
            <span className="localBadge"><span />On device</span>
        </div>
        <div className="editorGrid" onKeyDown={onEditorKeyDown}>
            <CriteriaEditor input={input} disabled={!ready} onChange={updateInput} />
            <DocumentInput value={input.document} disabled={!ready} onChange={(document) => updateInput({...input, document})} />
            <DecisionResult
                input={input}
                evaluation={evaluation}
                ready={ready}
                validationError={validateDecisionInput(input)}
                onRetry={() => void decisionRunner.retry()}
            />
        </div>
    </section>;
}
