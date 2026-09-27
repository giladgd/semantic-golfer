import {AddIconSVG} from "../../../icons/AddIconSVG.tsx";
import {DeleteIconSVG} from "../../../icons/DeleteIconSVG.tsx";
import {examples} from "../../../state/examples.ts";
import {maxCriteria, type DecisionInput} from "../../../../shared/decision.ts";
import "./CriteriaEditor.css";

export function CriteriaEditor({input, disabled, onChange}: {
    input: DecisionInput, disabled: boolean, onChange: (input: DecisionInput) => void
}) {
    return <fieldset className="criteriaEditor" disabled={disabled}>
        <div className="criteriaHeader">
            <h2>Criteria</h2>
            <label className="questionLabel" htmlFor="decisionQuestion">Question</label>
            <input
                id="decisionQuestion"
                className="questionInput"
                value={input.instruction}
                title={input.instruction}
                maxLength={1000}
                onChange={(event) => onChange({...input, instruction: event.target.value})}
            />
        </div>
        <div className="criteriaList">
            {input.criteria.map((criterion, index) => <div className="criterion" key={index}>
                <label htmlFor={`criterion-${index}`}>
                    {input.type === "noul" ? index === 0 ? "Yes" : "No" : input.type === "score" ? index : String.fromCharCode(65 + index)}
                </label>
                <input
                    id={`criterion-${index}`}
                    aria-label={`Criterion ${index + 1}`}
                    value={criterion}
                    title={criterion}
                    maxLength={1000}
                    placeholder="Describe the criterion"
                    onChange={(event) => onChange({
                        ...input,
                        criteria: input.criteria.map((value, i) => (i === index ? event.target.value : value))
                    })}
                />
                {input.type !== "noul" && <button
                    className="removeButton"
                    aria-label={`Remove criterion ${index + 1}`}
                    disabled={input.criteria.length <= 2}
                    onClick={() => onChange({...input, criteria: input.criteria.filter((_, i) => i !== index)})}
                >
                    <DeleteIconSVG />
                </button>}
            </div>)}
            {input.type !== "noul" && <button
                className="addButton"
                disabled={input.criteria.length >= maxCriteria[input.type]}
                onClick={() => onChange({...input, criteria: [...input.criteria, ""]})}
            >
                <AddIconSVG aria-hidden="true" />
                Add {input.type === "score" ? "level" : "choice"}
            </button>}
        </div>
        <div className="examples" aria-label="Examples">
            <span>Examples</span>
            {examples[input.type].map((example) => <button key={example.name} onClick={() => onChange(example.input)}>
                {example.name}<span aria-hidden="true">↗</span>
            </button>)}
        </div>
    </fieldset>;
}
