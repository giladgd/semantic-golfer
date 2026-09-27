import {State} from "lifecycle-utils";
import {electronLlmRpc} from "../rpc/llmRpc.ts";
import {gameRequest, games} from "../../shared/games.ts";
import {llmState} from "./llmState.ts";
import {DecisionRunner} from "./DecisionRunner.ts";
import {examples} from "./examples.ts";
import {getDraft, modeState, playState} from "./playState.ts";
import type {DecisionInput, DecisionType} from "../../shared/decision.ts";

export const decisionState = new State<{type: DecisionType, drafts: Record<DecisionType, DecisionInput>}>({
    type: "noul",
    drafts: {noul: examples.noul[0]!.input, choice: examples.choice[0]!.input, score: examples.score[0]!.input}
}, {queueEvents: false}); // Controlled inputs need updates before React restores their values after an input event.
export const decisionRunner = new DecisionRunner((request) => electronLlmRpc.evaluateDecision(request));

export function updateInput(input: DecisionInput) {
    decisionState.state = {...decisionState.state, drafts: {...decisionState.state.drafts, [input.type]: input}};
}

const listener = State.createCombinedChangeListener([decisionState, llmState, modeState, playState], ([editor, llm, mode, play]) => {
    if (llm.loadedModelId == null)
        void decisionRunner.setInput(undefined);
    else if (mode === "playground")
        void decisionRunner.setInput({modelId: llm.loadedModelId, input: editor.drafts[editor.type]});
    else {
        const draft = play.screen === "round" ? getDraft(play.drafts, llm.loadedModelId, play.game, play.level) : undefined;
        const level = games[play.game].levels.find(({id}) => id === play.level);
        const round = draft == null ? undefined : level?.rounds[draft.answers.length];
        void decisionRunner.setInput(round != null && draft?.document.trim()
            ? gameRequest(llm.loadedModelId, round, draft.document)
            : undefined);
    }
}, {callInstantlyWithCurrentState: true});

if (import.meta.hot)
    import.meta.hot.dispose(() => {
        listener.dispose();
        void decisionRunner.setInput(undefined);
    });
