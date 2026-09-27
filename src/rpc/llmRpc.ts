import {createRendererSideBirpc} from "../utils/createRendererSideBirpc.ts";
import {llmState} from "../state/llmState.ts";
import type {ElectronFunctions} from "../../electron/rpc/llmRpc.ts";
import type {LlmState} from "../../shared/llmState.ts";


const renderedFunctions = {
    updateState(state: LlmState) {
        llmState.state = state;
    }
} as const;
export type RenderedFunctions = typeof renderedFunctions;

export const electronLlmRpc = createRendererSideBirpc<ElectronFunctions, RenderedFunctions>("llmRpc", "llmRpc", renderedFunctions);

electronLlmRpc.getState()
    .then((state) => {
        llmState.state = state;
    })
    .catch((error) => {
        llmState.state = {...llmState.state, error: "Could not connect to the app: " + String(error)};
    });
