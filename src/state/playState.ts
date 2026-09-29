import {State} from "lifecycle-utils";
import {characterCount, gameProbabilities, gameRequest, games, isRoundWon, type GameId} from "../../shared/games.ts";
import {electronLlmRpc} from "../rpc/llmRpc.ts";
import type {ModelId} from "../../shared/models.ts";
import type {SavedLevelScore} from "../../shared/scores.ts";
import type {EvaluationState} from "./DecisionRunner.ts";

export type GameDraft = {
    document: string, answers: string[], startedAt?: number, saving?: boolean, error?: string, completion?: SavedLevelScore
};
const emptyDraft: GameDraft = {document: "", answers: []};
export const modeState = new State<"play" | "playground">("play", {queueEvents: false});
export const playState = new State<{
    screen: "games" | "levels" | "round" | "scores",
    game: GameId, level: number, drafts: Record<string, GameDraft>
}>({screen: "games", game: "lock", level: 1, drafts: {}}, {queueEvents: false});

export function getDraft(drafts: Record<string, GameDraft>, modelId: ModelId, game: GameId, level: number) {
    return drafts[`${modelId}/${game}/${level}`] ?? emptyDraft;
}

export function updateGame(modelId: ModelId, game: GameId, level: number, update: Partial<GameDraft>) {
    playState.state = {...playState.state, drafts: {
        ...playState.state.drafts, [`${modelId}/${game}/${level}`]: {...getDraft(playState.state.drafts, modelId, game, level), ...update}
    }};
}

export function openLevel(game: GameId, level: number) {
    playState.state = {...playState.state, screen: "round", game, level};
}

export function finishRound(modelId: ModelId, game: GameId, levelId: number, evaluation: EvaluationState) {
    const draft = getDraft(playState.state.drafts, modelId, game, levelId);
    const level = games[game].levels.find(({id}) => id === levelId)!;
    const round = level.rounds[draft.answers.length];
    if (round == null || evaluation.error != null || evaluation.result == null ||
        JSON.stringify(evaluation.result.request) !== JSON.stringify(gameRequest(modelId, round, draft.document)) ||
        !isRoundWon(game, round, draft.document, gameProbabilities(evaluation.result)))
        return;
    updateGame(modelId, game, levelId, {answers: [...draft.answers, draft.document], document: "", startedAt: undefined});
    if (draft.answers.length + 1 === level.rounds.length)
        void saveGameScore(modelId, game, levelId);
}

export async function saveGameScore(modelId: ModelId, game: GameId, level: number) {
    const draft = getDraft(playState.state.drafts, modelId, game, level);
    if (draft.saving || draft.completion != null)
        return;
    updateGame(modelId, game, level, {saving: true, error: undefined});
    try {
        const completion = await electronLlmRpc.saveLevelScore({modelId, game, level, characters: draft.answers.map(characterCount)});
        updateGame(modelId, game, level, {completion, saving: false});
    } catch (error) {
        updateGame(modelId, game, level, {error: String(error), saving: false});
    }
}
