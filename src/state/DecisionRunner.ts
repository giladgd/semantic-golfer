import {State, withSingleFlight} from "lifecycle-utils";
import {validateDecisionRequest, type DecisionRequest, type DecisionResult} from "../../shared/decision.ts";

export type EvaluationState = {
    running: boolean,
    result?: DecisionResult & {request: DecisionRequest},
    error?: string
};

export class DecisionRunner {
    public readonly state = new State<EvaluationState>({running: false});
    private latest?: DecisionRequest;
    private completedKey?: string;
    private readonly evaluate: (request: DecisionRequest) => Promise<DecisionResult>;

    public constructor(evaluate: (request: DecisionRequest) => Promise<DecisionResult>) {
        this.evaluate = evaluate;
    }

    public setInput(request?: DecisionRequest) {
        const changed = JSON.stringify(request) !== JSON.stringify(this.latest);
        this.latest = request;
        if (request == null) {
            this.completedKey = undefined;
            this.state.state = {running: false};
        } else if (changed && this.state.state.error != null)
            this.state.state = {...this.state.state, error: undefined};

        return withSingleFlight([this], async () => {
            // Keep only the newest input. Never queue a request for each keystroke.
            while (this.latest != null && validateDecisionRequest(this.latest) == null &&
                JSON.stringify(this.latest) !== this.completedKey) {
                const current = this.latest;
                const key = JSON.stringify(current);
                this.state.state = {...this.state.state, running: true, error: undefined};
                try {
                    const result = await this.evaluate(current);
                    if (this.latest?.modelId === current.modelId)
                        this.state.state = {running: true, result: {...result, request: current}};
                } catch (error) {
                    if (JSON.stringify(this.latest) === key)
                        this.state.state = {...this.state.state, error: String(error)};
                }
                this.completedKey = this.latest == null ? undefined : key;
            }
            this.state.state = {...this.state.state, running: false};
        });
    }

    public retry() {
        if (this.state.state.running || this.state.state.error == null)
            return Promise.resolve();
        this.completedKey = undefined;
        return this.setInput(this.latest);
    }
}
