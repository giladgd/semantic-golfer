import {State} from "lifecycle-utils";
import {initialLlmState} from "../../shared/llmState.ts";

export const llmState = new State(initialLlmState);
