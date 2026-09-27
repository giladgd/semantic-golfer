import {State, withSingleFlight} from "lifecycle-utils";
import {games} from "../../shared/games.ts";
import {electronLlmRpc} from "../rpc/llmRpc.ts";
import {llmState} from "./llmState.ts";
import {getDraft, modeState, playState, updateGame} from "./playState.ts";
import type {ModelId} from "../../shared/models.ts";

export const modelSwitchState = new State<{resolve: (confirmed: boolean) => void} | undefined>(undefined);

export function answerModelSwitch(confirmed: boolean) {
    const pending = modelSwitchState.state;
    modelSwitchState.state = undefined;
    pending?.resolve(confirmed);
}

export function selectModel(modelId: ModelId) {
    return withSingleFlight([modelSwitchState], async () => {
        const currentModel = llmState.state.loadedModelId;
        if (modelId === currentModel)
            return;
        const play = playState.state;
        const level = games[play.game].levels.find(({id}) => id === play.level)!;
        if (currentModel != null && modeState.state === "play" && play.screen === "round" &&
            getDraft(play.drafts, currentModel, play.game, play.level).answers.length < level.rounds.length) {
            const confirmed = await new Promise<boolean>((resolve) => {
                modelSwitchState.state = {resolve};
            });
            if (!confirmed)
                return;
            // Stop only the unfinished round; completed rounds stay with their original model.
            updateGame(currentModel, play.game, play.level, {document: "", startedAt: undefined});
            playState.state = {...playState.state, screen: "levels"};
        }
        await electronLlmRpc.loadModel(modelId);
    });
}
