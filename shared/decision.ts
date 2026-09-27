import type {DecisionAnswer, DecisionQuestion} from "node-llama-cpp";
import type {ModelId} from "./models.ts";

export const decisionTypes = ["noul", "choice", "score"] as const;
export type DecisionType = typeof decisionTypes[number];
export const maxCriteria = {noul: 2, choice: 12, score: 10} as const;
export type DecisionInput = {
    type: DecisionType,
    document: string,
    instruction: string,
    criteria: string[]
};
export type DecisionRequest = {modelId: ModelId, input: DecisionInput, additionalInputs?: DecisionInput[]};
export type DecisionResult = {
    answer: DecisionAnswer<DecisionQuestion>,
    additionalAnswers?: DecisionAnswer<DecisionQuestion>[],
    duration: number
};

export function validateDecisionRequest(request: DecisionRequest): string | undefined {
    const error = validateDecisionInput(request?.input);
    if (error != null)
        return error;
    if (request.additionalInputs == null)
        return undefined;
    if (!Array.isArray(request.additionalInputs) || request.additionalInputs.length > 6)
        return "Use at most seven questions per document.";
    for (const input of request.additionalInputs) {
        const error = validateDecisionInput(input);
        if (error != null)
            return error;
        if (input.document !== request.input.document)
            return "All questions must use the same document.";
    }
    return undefined;
}

export function validateDecisionInput(input: DecisionInput): string | undefined {
    if (input == null || !decisionTypes.includes(input.type))
        return "Choose a decision type.";
    if (typeof input.document !== "string" || input.document.length > 32_000)
        return "Keep the document under 32,000 characters.";
    if (typeof input.instruction !== "string" || !input.instruction.trim() || input.instruction.length > 1_000)
        return "Enter a question (up to 1,000 characters).";
    if (!Array.isArray(input.criteria) || input.criteria.length < 2 || input.criteria.length > maxCriteria[input.type])
        return input.type === "noul" ? "Use exactly two criteria." : `Use between 2 and ${maxCriteria[input.type]} criteria.`;
    if (input.criteria.some((criterion) => typeof criterion !== "string" || !criterion.trim() || criterion.length > 1_000))
        return "Fill in each criterion (up to 1,000 characters).";
    return undefined;
}

export function createQuestion(input: DecisionInput): DecisionQuestion {
    const error = validateDecisionInput(input);
    if (error != null)
        throw new Error(error);
    const {type, instruction, criteria} = input;
    if (type === "noul")
        return {type, instruction, criteria: {true: criteria[0]!, false: criteria[1]!}};
    if (type === "choice")
        return {type, instruction, criteria: Object.fromEntries(criteria.map((criterion, index) => [String(index), criterion]))};
    return {type, instruction, criteria};
}
