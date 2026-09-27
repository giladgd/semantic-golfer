import {decisionTypes, validateDecisionInput} from "../../../../shared/decision.ts";
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
        <div className="editorGrid">
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
