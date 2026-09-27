import {randomUUID} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {app} from "electron";
import {withLock} from "lifecycle-utils";
import {models} from "../../shared/models.ts";
import {addLevelScore, readScoreRecords, type LevelScoreInput} from "../../shared/scores.ts";
import {llmState} from "./llmState.ts";

const scoreFile = () => path.join(app.getPath("userData"), "scores.json");

export async function loadScores() {
    try {
        const scores = readScoreRecords(JSON.parse(await fs.readFile(scoreFile(), "utf8")));
        llmState.state = {...llmState.state, scores};
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
            llmState.state = {...llmState.state, scoreError: `Unable to read saved scores: ${String(error)}`};
    }
}

export async function saveLevelScore(input: LevelScoreInput) {
    return await withLock([llmState, "scores"], async () => {
        if (llmState.state.scoreError != null)
            throw new Error("Saved scores could not be read. The existing score file has been left untouched.");
        const builtin = models.find(({id}) => id === input?.modelId);
        const name = builtin == null ? llmState.state.localModels.find(({id}) => id === input?.modelId)?.name :
            `${builtin.name} ${builtin.parameters} ${builtin.quant}`;
        if (name == null)
            throw new Error("Unknown model for this score.");
        const saved = addLevelScore(llmState.state.scores, input, name);
        const scores = llmState.state.scores.filter((record) => record.modelId !== input.modelId ||
            record.game !== input.game || record.level !== input.level).concat(saved.record);
        const file = scoreFile();
        const temporary = `${file}.${randomUUID()}.tmp`;
        await fs.mkdir(path.dirname(file), {recursive: true});
        try {
            await fs.writeFile(temporary, JSON.stringify({version: 1, records: scores}, null, 2), {encoding: "utf8", mode: 0o600});
            await fs.rename(temporary, file);
        } finally {
            await fs.rm(temporary, {force: true});
        }
        llmState.state = {...llmState.state, scores};
        return saved;
    });
}
