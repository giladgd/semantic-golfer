import {randomUUID} from "node:crypto";
import {rename, rm, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {getLlama} from "node-llama-cpp";
import {createQuestion, type DecisionInput, type DecisionResult} from "../shared/decision.ts";
import {models} from "../shared/models.ts";
import {getSceneRequest, getSceneSteps, scenes} from "../site/demo/scenes.ts";

type Recording = {input: DecisionInput, additionalInputs?: DecisionInput[],
    frames: Array<Omit<DecisionResult, "duration"> & {document: string, measuredDuration: number}>};

export async function recordLandingDemo(modelPath: string, output = new URL("../site/demo/recordings.json", import.meta.url)) {
    const modelBytes = (await stat(modelPath)).size;
    const llama = await getLlama();
    try {
        const model = await llama.loadModel({modelPath});
        try {
            const context = await model.createDecisionContext({contextSize: {max: 4096}, parallelQuestions: 1});
            try {
                await context.warmup();
                const recordings: Recording[] = [];
                for (const scene of scenes) {
                    const {input, additionalInputs} = getSceneRequest(scene, "");
                    const frames: Recording["frames"] = [];
                    const documents = [...new Set(getSceneSteps(scene).steps.map(({document}) => document))];
                    for (const document of documents) {
                        const request = getSceneRequest(scene, document);
                        const inputs = [request.input, ...request.additionalInputs ?? []];
                        const questions = Object.fromEntries(inputs.map((input, index) => [String(index), createQuestion(input)]));
                        const start = performance.now();
                        const answers = await context.decide(request.input.document, questions);
                        const measuredDuration = performance.now() - start;
                        const additionalAnswers = inputs.slice(1).map((_, index) => answers[String(index + 1)]!);
                        frames.push({document, answer: answers["0"]!, ...(additionalAnswers.length > 0 ? {additionalAnswers} : {}),
                            measuredDuration});
                        console.info(`${scene.title}: ${frames.length}/${documents.length} · ${measuredDuration.toFixed(1)}ms ·`,
                            JSON.stringify(document));
                    }
                    recordings.push({input, ...(additionalInputs != null ? {additionalInputs} : {}), frames});
                }
                const temporary = new URL(`${output.href}.${randomUUID()}.tmp`);
                try {
                    await writeFile(temporary, JSON.stringify({
                        model: models[0], modelFile: path.basename(modelPath), modelBytes,
                        recordedAt: new Date().toISOString(), recordings
                    }, null, 2) + "\n");
                    await rename(temporary, output);
                } finally {
                    await rm(temporary, {force: true});
                }
            } finally {
                await context.dispose();
            }
        } finally {
            await model.dispose();
        }
    } finally {
        await llama.dispose();
    }
}

if (import.meta.main) {
    const modelPath = process.argv[2];
    if (!modelPath)
        throw new Error("Usage: npm run record:demo -- /path/to/gemma-q8.gguf (Gemma 4 5B E2B Q8_0)");
    await recordLandingDemo(modelPath);
}
