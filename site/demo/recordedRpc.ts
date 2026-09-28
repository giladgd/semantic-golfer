import {LongTimeout} from "lifecycle-utils";
import {initialLlmState} from "../../shared/llmState.ts";
import recordings from "./recordings.json" with {type: "json"};
import type {DecisionRequest, DecisionResult} from "../../shared/decision.ts";

export function createRendererSideBirpc() {
    return {
        async getState() {
            return {...initialLlmState, loadedModelId: recordings.model.id,
                models: {[recordings.model.id]: {downloaded: true}}};
        },
        async evaluateDecision({input, additionalInputs}: DecisionRequest): Promise<DecisionResult> {
            const scene = recordings.recordings.find(({input: recorded}) =>
                recorded.instruction === input.instruction && recorded.type === input.type);
            const document = additionalInputs == null ? input.document : JSON.parse(input.document.slice("Text: ".length)) as string;
            const frame = scene?.frames.find((frame) => frame.document === document);
            if (frame == null)
                throw new Error("This input is not part of the recorded demo.");
            const duration = frame.measuredDuration;
            await new Promise<void>((resolve) => new LongTimeout(resolve, duration));
            return {answer: frame.answer, ...("additionalAnswers" in frame ? {additionalAnswers: frame.additionalAnswers} : {}),
                duration} as DecisionResult;
        }
    };
}
