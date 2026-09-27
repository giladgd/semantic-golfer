import {lockLevels} from "./levels/lock.ts";
import {camouflageLevels} from "./levels/camouflage.ts";
import type {DecisionInput, DecisionRequest, DecisionResult} from "./decision.ts";
import type {ModelId} from "./models.ts";

export type GameId = "lock" | "camouflage";
export type GameRound = {id: string, title: string, limit: number, labels: string[], questions: Omit<DecisionInput, "document">[]};
export type GameLevel = {id: number, title: string, skill: string, rounds: GameRound[]};
export const lockTarget = 0.7;
export const camouflageTarget = {min: lockTarget, other: lockTarget};

export const games: Record<GameId, {name: string, description: string, levels: GameLevel[]}> = {
    lock: {name: "Semantic Golfing", description: "Write a short message that matches every condition within the character limit.", levels: lockLevels},
    camouflage: {name: "Category Camouflage", description: "Blend two meanings in a short message while keeping the other categories out.", levels: camouflageLevels}
};

export function characterCount(text: string) {
    return Array.from(text).length;
}

export function gameRequest(modelId: ModelId, round: GameRound, document: string): DecisionRequest {
    const inputs = round.questions.map((question) => ({...question, document: `Text: ${JSON.stringify(document)}`}));
    return {modelId, input: inputs[0]!, ...(inputs.length > 1 ? {additionalInputs: inputs.slice(1)} : {})};
}

export function gameProbabilities(game: GameId, result?: DecisionResult): number[] {
    if (result == null)
        return [];
    return [result.answer, ...result.additionalAnswers ?? []].map((answer) => {
        if (game === "lock")
            return answer.type === "noul" ? answer.value : 0;
        return answer.type === "choice" ? answer.probabilities["1"] ?? 0 : 0;
    });
}

export function isRoundWon(game: GameId, round: GameRound, document: string, probabilities: number[]) {
    if (!document.trim() || characterCount(document) > round.limit || probabilities.length !== round.labels.length ||
        probabilities.some((value) => !Number.isFinite(value) || value < 0 || value > 1))
        return false;
    return probabilities.every((value, index) => (game === "lock" || index < 2
        ? value >= (game === "lock" ? lockTarget : camouflageTarget.min)
        : value < camouflageTarget.other));
}

export function roundScore(round: GameRound, characters: number) {
    if (!Number.isInteger(characters) || characters < 1 || characters > round.limit)
        throw new Error("The answer must fit the round's character limit.");
    return Math.max(1, Math.round(1000 * (1 - characters / round.limit)));
}

export function levelScore(level: GameLevel, characters: number[]) {
    if (characters.length !== level.rounds.length)
        throw new Error("Finish every round before saving a level score.");
    return level.rounds.reduce((sum, round, index) => sum + roundScore(round, characters[index]!), 0);
}
