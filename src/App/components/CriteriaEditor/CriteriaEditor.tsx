import {DeleteIconSVG} from "../../../icons/DeleteIconSVG.tsx";
import {examples} from "../../../state/examples.ts";
import {getDecisionCriteria, isValidCriterion, maxCriteria, type DecisionInput} from "../../../../shared/decision.ts";
import "./CriteriaEditor.css";

export function CriteriaEditor({input, disabled, onChange}: {
    input: DecisionInput, disabled: boolean, onChange: (input: DecisionInput) => void
}) {
    const criteria = getDecisionCriteria(input);
    const rows = input.type !== "noul" && input.criteria.length < maxCriteria[input.type] && input.criteria.at(-1)?.trim()
        ? [...input.criteria, ""] : input.criteria;
    return <fieldset className="criteriaEditor" disabled={disabled}>
        <label className="instructionHeader" htmlFor="decisionQuestion">
            <span>Instruction</span>
            <textarea
                id="decisionQuestion"
                data-gramm="false"
                data-enable-grammarly="false"
                data-enable-grazie="false"
                data-lt-active="false"
                rows={1}
                value={input.instruction}
                title={input.instruction}
                maxLength={1000}
                onChange={(event) => onChange({...input, instruction: event.target.value})}
            />
        </label>
        <h2 className="criteriaTitle">Criteria</h2>
        <div className="criteriaList">
            {rows.map((criterion, index) => <div className="criterion" key={index}>
                <label htmlFor={`criterion-${index}`}>
                    {input.type === "noul" ? index === 0 ? "Yes" : "No" : input.type === "score" ? index : choiceLabel(index)}
                </label>
                <textarea
                    id={`criterion-${index}`}
                    data-gramm="false"
                    data-enable-grammarly="false"
                    data-enable-grazie="false"
                    data-lt-active="false"
                    rows={1}
                    aria-label={`Criterion ${index + 1}`}
                    aria-invalid={index < criteria.length && !isValidCriterion(criterion, input.type)}
                    value={criterion}
                    title={criterion}
                    maxLength={1000}
                    placeholder={input.type === "choice" ? "Describe this choice" : input.type === "score" ? "Describe this level" :
                        index === 0 ? "Describe what counts as yes" : "Describe what counts as no"}
                    onChange={(event) => {
                        const criteria = [...input.criteria];
                        criteria[index] = event.target.value;
                        onChange({...input, criteria});
                    }}
                />
                <button
                    className="removeButton"
                    aria-label={`Remove criterion ${index + 1}`}
                    disabled={input.type === "noul" || index >= criteria.length || criteria.length <= 2}
                    onClick={() => onChange({...input, criteria: input.criteria.filter((_, i) => i !== index)})}
                >
                    <DeleteIconSVG />
                </button>
            </div>)}
        </div>
        <div className="examples" aria-label="Examples">
            <span>Examples</span>
            {examples[input.type].map((example) => <button key={example.name} onClick={() => onChange(example.input)}>
                {example.name}<span aria-hidden="true">↗</span>
            </button>)}
        </div>
    </fieldset>;
}

function choiceLabel(index: number): string {
    const prefix = index >= 26 ? choiceLabel(Math.floor(index / 26) - 1) : "";
    return prefix + String.fromCharCode(65 + index % 26);
}
