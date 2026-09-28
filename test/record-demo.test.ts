import assert from "node:assert/strict";
import {cp, mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {mock, test} from "node:test";
import {setImmediate} from "node:timers/promises";
import {pathToFileURL} from "node:url";
import {createQuestion} from "../shared/decision.ts";
import {models} from "../shared/models.ts";
import {getSceneRequest, getSceneSteps, scenes} from "../site/demo/scenes.ts";
import type {DecisionQuestion} from "node-llama-cpp";

test("recording refreshes every frame sequentially, measures inference, and preserves the file on failure", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "semantic-golfer-recordings-"));
    const modelPath = path.join(directory, "gemma-q8.gguf");
    const output = pathToFileURL(path.join(directory, "recordings.json"));
    const requests = scenes.flatMap((scene) => [...new Set(getSceneSteps(scene).steps.map(({document}) => document))]
        .map((document) => getSceneRequest(scene, document)));
    let clock = 0;
    let measuredDuration = 23;
    let completed = 0;
    let active = false;
    let fail = false;
    const disposed: string[] = [];
    const answer = (question: DecisionQuestion, index: number) => {
        if (question.type === "noul")
            return {type: "noul", value: measuredDuration / 100 + index / 10};
        const probabilities = [0.2, 0.5, 0.3];
        return question.type === "score" ? {type: "score", score: 1.1, confidence: 0.5, probabilities} :
            {type: "choice", choice: "1", confidence: 0.5, probabilities: {...probabilities}};
    };
    mock.method(performance, "now", () => clock);
    mock.method(console, "info", () => {
        clock += 100;
    });
    mock.module("node-llama-cpp", {namedExports: {getLlama: async () => ({
        async loadModel(options: {modelPath: string}) {
            assert.equal(options.modelPath, modelPath);
            return {
                async createDecisionContext(options: {parallelQuestions: number}) {
                    assert.equal(options.parallelQuestions, 1);
                    return {
                        async warmup() {
                            clock += 1_000;
                        },
                        async decide(document: string, questions: Record<string, DecisionQuestion>) {
                            assert.equal(active, false, "Evaluations must never overlap");
                            active = true;
                            const request = requests[completed]!;
                            assert.equal(document, request.input.document);
                            assert.deepEqual(questions, Object.fromEntries([request.input, ...request.additionalInputs ?? []]
                                .map((input, index) => [String(index), createQuestion(input)])));
                            await setImmediate();
                            active = false;
                            if (fail && completed === 2)
                                throw new Error("Inference failed");
                            clock += measuredDuration;
                            completed++;
                            return Object.fromEntries(Object.entries(questions)
                                .map(([key, question]) => [key, answer(question, Number(key))]));
                        },
                        async dispose() {
                            disposed.push("context");
                        }
                    };
                },
                async dispose() {
                    disposed.push("model");
                }
            };
        },
        async dispose() {
            disposed.push("llama");
        }
    })}});
    try {
        await writeFile(modelPath, "test model");
        await cp(new URL("../site/demo/recordings.json", import.meta.url), output);
        const {recordLandingDemo} = await import("../scripts/recordLandingDemo.ts");
        for (measuredDuration of [23, 29]) {
            completed = 0;
            disposed.length = 0;
            await recordLandingDemo(modelPath, output);
            assert.equal(completed, requests.length, "Existing frames must be reevaluated on every run");
            assert.deepEqual(disposed, ["context", "model", "llama"]);
            const data = JSON.parse(await readFile(output, "utf8"));
            assert.deepEqual(data.model, models[0]);
            assert.equal(data.modelFile, "gemma-q8.gguf");
            assert.equal(data.modelBytes, 10);
            assert.ok(Number.isFinite(Date.parse(data.recordedAt)));
            assert.deepEqual(data.recordings, scenes.map((scene) => {
                const {input, additionalInputs} = getSceneRequest(scene, "");
                const additionalAnswers = additionalInputs?.map((input, index) => answer(createQuestion(input), index + 1));
                return {input, ...(additionalInputs ? {additionalInputs} : {}),
                    frames: [...new Set(getSceneSteps(scene).steps.map(({document}) => document))].map((document) => ({
                        document, answer: answer(createQuestion(input), 0),
                        ...(additionalAnswers ? {additionalAnswers} : {}), measuredDuration
                    }))};
            }));
        }
        const saved = await readFile(output, "utf8");
        completed = 0;
        disposed.length = 0;
        fail = true;
        await assert.rejects(recordLandingDemo(modelPath, output), /Inference failed/);
        assert.equal(completed, 2);
        assert.deepEqual(disposed, ["context", "model", "llama"]);
        assert.equal(await readFile(output, "utf8"), saved);
        assert.deepEqual((await readdir(directory)).sort(), ["gemma-q8.gguf", "recordings.json"]);
    } finally {
        mock.restoreAll();
        await rm(directory, {recursive: true, force: true});
    }
});
