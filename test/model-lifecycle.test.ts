import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {setImmediate} from "node:timers/promises";
import {mock, test} from "node:test";
import {initialLlmState} from "../shared/llmState.ts";
import {models} from "../shared/models.ts";
import {llmState} from "../electron/state/llmState.ts";
import type {DecisionRequest} from "../shared/decision.ts";

test("model changes await inference and full disposal; failed loads and deletion release resources", async () => {
    const profile = await mkdtemp(path.join(tmpdir(), "model-lifecycle-"));
    const events: string[] = [];
    let liveModels = 0;
    let liveContexts = 0;
    let failure: "load" | "context" | "warmup" | "dispose" | undefined;
    let decisionGate: ReturnType<typeof Promise.withResolvers<void>> | undefined;
    let contextGate: ReturnType<typeof Promise.withResolvers<void>> | undefined;
    let modelGate: ReturnType<typeof Promise.withResolvers<void>> | undefined;
    let modelDisposing = Promise.withResolvers<void>();

    class Model {
        public disposed = false;

        public constructor() {
            assert.equal(liveModels, 0, "the previous model must be fully released before loading");
            assert.equal(liveContexts, 0);
            liveModels++;
        }

        public async createDecisionContext() {
            if (failure === "context")
                throw new Error("context failed");
            liveContexts++;
            let disposed = false;
            return {
                async warmup() {
                    if (failure === "warmup")
                        throw new Error("warmup failed");
                },
                async decide() {
                    events.push("decide");
                    await decisionGate?.promise;
                    events.push("decided");
                    return {"0": {type: "noul", value: 0.8}};
                },
                async dispose() {
                    if (disposed)
                        return;
                    disposed = true;
                    events.push("dispose context");
                    await contextGate?.promise;
                    liveContexts--;
                    events.push("context disposed");
                    if (failure === "dispose")
                        throw new Error("context disposal failed");
                }
            };
        }

        public async dispose() {
            if (this.disposed)
                return;
            this.disposed = true;
            events.push("dispose model");
            modelDisposing.resolve();
            await modelGate?.promise;
            assert.equal(liveContexts, 0);
            liveModels--;
            events.push("model disposed");
        }
    }

    mock.module("electron", {namedExports: {app: {getPath: () => profile}, BrowserWindow: class {}, dialog: {}, shell: {}}});
    mock.module("node-llama-cpp", {namedExports: {
        LlamaLogLevel: {error: "error"},
        createModelDownloader: () => {
            throw new Error("Unexpected download");
        },
        getLlama: async () => ({
            async loadModel() {
                events.push("load");
                if (failure === "load")
                    throw new Error("load failed");
                return new Model();
            }
        })
    }});
    const {loadModel, evaluateDecision, deleteModel} = await import("../electron/llm/models.ts");
    llmState.state = {...initialLlmState, models: Object.fromEntries(models.map(({id}) => [id, {downloaded: true}]))};
    const request: DecisionRequest = {modelId: "qwen-0.8b", input: {
        type: "noul", document: "Help my cat", instruction: "Does this mention an animal?", criteria: ["An animal is named", "No animal"]
    }};
    try {
        await mkdir(path.join(profile, "models"));
        for (const {id} of models)
            await writeFile(path.join(profile, "models", `${id}.gguf`), "test model");
        await loadModel("qwen-0.8b");
        assert.equal(llmState.state.loadedModelId, "qwen-0.8b");
        events.length = 0;
        decisionGate = Promise.withResolvers();
        contextGate = Promise.withResolvers();
        modelGate = Promise.withResolvers();
        const deciding = evaluateDecision(request);
        await setImmediate();
        const switching = loadModel("qwen-2b");
        const stale = assert.rejects(evaluateDecision(request), /no longer loaded/);
        await loadModel("gemma-q8"); // A second switch cannot overlap the first.
        await setImmediate();
        assert.deepEqual(events, ["decide"]);
        decisionGate.resolve();
        await deciding;
        await setImmediate();
        assert.deepEqual(events, ["decide", "decided", "dispose context"]);
        contextGate.resolve();
        await setImmediate();
        assert.equal(events.at(-1), "dispose model");
        assert.equal(liveModels, 1);
        modelGate.resolve();
        await switching;
        await stale;
        assert.equal(llmState.state.loadedModelId, "qwen-2b");
        assert.deepEqual(events.slice(-3), ["dispose model", "model disposed", "load"]);
        const count = events.length;
        await loadModel("qwen-2b");
        assert.equal(events.length, count, "reselecting the current model should do nothing");

        for (const id of ["gemma-q8", "qwen-0.8b", "gemma-q6", "qwen-2b"] as const) {
            await loadModel(id);
            assert.equal(llmState.state.loadedModelId, id);
            assert.equal(liveModels, 1);
            assert.equal(liveContexts, 1);
        }
        for (failure of ["load", "context", "warmup"] as const) {
            await loadModel("gemma-q8");
            assert.match(llmState.state.error!, new RegExp(`${failure} failed`));
            assert.equal(llmState.state.loading, undefined);
            assert.equal(llmState.state.loadedModelId, undefined);
            assert.equal(liveModels, 0);
            assert.equal(liveContexts, 0);
        }
        failure = undefined;
        await loadModel("qwen-0.8b");
        decisionGate = Promise.withResolvers();
        modelGate = Promise.withResolvers();
        modelDisposing = Promise.withResolvers();
        const finalDecision = evaluateDecision(request);
        await setImmediate();
        const deleting = deleteModel("qwen-0.8b");
        const nextModel = loadModel("qwen-2b");
        decisionGate.resolve();
        await finalDecision;
        await modelDisposing.promise;
        const file = path.join(profile, "models/qwen-0.8b.gguf");
        assert.equal(await readFile(file, "utf8"), "test model");
        await loadModel("qwen-0.8b");
        assert.equal(liveModels, 1);
        modelGate.resolve();
        await Promise.all([deleting, nextModel]);
        await assert.rejects(readFile(file), {code: "ENOENT"});
        assert.equal(llmState.state.loadedModelId, "qwen-2b");
        assert.equal(liveModels, 1);
        assert.equal(liveContexts, 1);

        await loadModel("qwen-2b");
        failure = "dispose";
        events.length = 0;
        await loadModel("gemma-q8");
        assert.equal(liveModels, 0, "model disposal must still run when context disposal throws");
        assert.equal(liveContexts, 0);
        assert.match(llmState.state.error!, /Restart the app/);
        assert.ok(!events.includes("load"));
        events.length = 0;
        failure = undefined;
        await loadModel("gemma-q6");
        await assert.rejects(deleteModel("qwen-2b"), /Restart the app/);
        assert.deepEqual(events, [], "a disposal failure must not be forgotten by retrying an already-disposed object");
        assert.equal(await readFile(path.join(profile, "models/qwen-2b.gguf"), "utf8"), "test model");
    } finally {
        await rm(profile, {recursive: true, force: true});
        mock.restoreAll();
    }
});
