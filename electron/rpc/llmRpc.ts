import {BrowserWindow} from "electron";
import {createElectronSideBirpc} from "../utils/createElectronSideBirpc.ts";
import {llmState} from "../state/llmState.ts";
import {saveLevelScore} from "../state/scores.ts";
import {cancelDownload, deleteModel, downloadModel, evaluateDecision, loadModel, openModelsDirectory, selectModelFile} from "../llm/models.ts";
import type {RenderedFunctions} from "../../src/rpc/llmRpc.ts";

const functions = (window: BrowserWindow) => ({
    getState: () => llmState.state,
    saveLevelScore,
    downloadModel,
    cancelDownload,
    loadModel,
    evaluateDecision,
    openModelsDirectory,
    selectModelFile: () => selectModelFile(window),
    deleteModel
});

export type ElectronFunctions = ReturnType<typeof functions>;

export function registerLlmRpc(window: BrowserWindow) {
    const rpc = createElectronSideBirpc<RenderedFunctions, ElectronFunctions>("llmRpc", "llmRpc", window, functions(window));
    const listener = llmState.createChangeListener((state) => {
        if (!window.isDestroyed())
            rpc.updateState.asEvent(state);
    });
    window.once("closed", () => {
        listener.dispose();
        rpc.$close();
    });
}
