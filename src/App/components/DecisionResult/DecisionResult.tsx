import {CheckIconSVG} from "../../../icons/CheckIconSVG.tsx";
import {NoulScale} from "../NoulScale/NoulScale.tsx";
import {ProgressBar} from "../ProgressBar/ProgressBar.tsx";
import {getDecisionCriteria, type DecisionInput} from "../../../../shared/decision.ts";
import "./DecisionResult.css";
import type {EvaluationState} from "../../../state/DecisionRunner.ts";

export function DecisionResult({input, evaluation, ready, validationError, onRetry}: {
    input: DecisionInput, evaluation: EvaluationState, ready: boolean, validationError?: string, onRetry: () => void
}) {
    const result = evaluation.result?.request.input.type === input.type ? evaluation.result : undefined;
    const answer = result?.answer;
    const confidence = answer != null && answer.type !== "noul" ? answer.confidence : undefined;
    const criteria = getDecisionCriteria(result?.request.input ?? input);
    const selected = answer?.type === "choice" ? Number(answer.choice) : undefined;
    const probabilities = answer?.type === "choice" ? criteria.map((_, index) => answer.probabilities[String(index)] ?? 0) :
        answer?.type === "score" ? answer.probabilities : undefined;
    const emptyLabel = !ready ? "Load a model to begin" : validationError == null ? "Waiting for a decision" : "Complete the criteria";

    return <section className="decisionResult" data-type={input.type} aria-label="Decision results" aria-busy={evaluation.running}>
        <h2>Decision</h2>
        {(validationError ?? evaluation.error) != null && <div className="error">
            <div role="alert">{validationError ?? evaluation.error}</div>
            {validationError == null && ready && !evaluation.running && <button onClick={onRetry}>Retry</button>}
        </div>}
        <div className="decisionContent" tabIndex={0} role="region" aria-label="Decision details">
            <div className="answerSummary">
                {input.type === "choice" ? <>
                    <div className="choiceValue">
                        {criteria.map((criterion, index) => <span
                            key={index}
                            data-selected={selected === index}
                            aria-hidden={selected !== index}
                        >
                            {criterion}
                        </span>)}
                        {selected == null && <span data-selected>—</span>}
                    </div>
                    <div className="answerLabel">{answer == null ? emptyLabel : "Selected choice"}</div>
                </> : <>
                    <div className="answerValue" data-empty={answer == null}>
                        {answer?.type === "noul" ? <>{(answer.value * 100).toFixed(1)}<span>%</span></> :
                            answer?.type === "score" ? <>{answer.score.toFixed(2)}<span> / {criteria.length - 1}</span></> : "—"}
                    </div>
                    <div className="answerLabel">{answer == null ? emptyLabel : input.type === "noul" ? "Probability of yes" : "Score"}</div>
                </>}
            </div>
            {input.type === "noul" ? <NoulScale value={answer?.type === "noul" ? answer.value : undefined} /> : <>
                {input.type === "score" && <div className="scoreScale">
                    <ProgressBar value={answer?.type === "score" ? answer.score / (criteria.length - 1) : 0} label="Decision score" />
                    <div className="scoreMarkers">{criteria.map((criterion, index) => <span key={index} title={criterion}>{index}</span>)}</div>
                    <div className="scoreEndpoints"><span>{criteria[0]}</span><span>{criteria.at(-1)}</span></div>
                </div>}
                <div className="probabilities">
                    {criteria.map((criterion, index) => <div className="probability" key={index} data-selected={selected === index}>
                        <div className="probabilityLabel">
                            <span className="criterionLabel" title={criterion}>
                                {input.type === "choice" && <CheckIconSVG className="selectedIcon" />}
                                {input.type === "score" ? `${index} · ${criterion}` : criterion}
                            </span>
                            <span>{probabilities == null ? "—" : `${((probabilities[index] ?? 0) * 100).toFixed(1)}%`}</span>
                        </div>
                        <ProgressBar value={probabilities?.[index] ?? 0} label={`${criterion}${selected === index ? ", selected" : ""}`} />
                    </div>)}
                </div>
            </>}
        </div>
        <div className="resultFooter">
            {input.type !== "noul" && <div className="confidence">
                <span>Confidence</span>
                <strong>{confidence == null ? "—" : `${(confidence * 100).toFixed(1)}%`}</strong>
                <ProgressBar value={confidence ?? 0} label="Decision confidence" />
            </div>}
            <div className="timing" aria-label="Decision time"><strong>
                {result == null ? "—" : <>{result.duration.toLocaleString(undefined, {maximumFractionDigits: 1})}<span> ms</span></>}
            </strong>
            </div>
        </div>
    </section>;
}
