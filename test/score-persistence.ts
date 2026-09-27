// Run with Electron after building: xvfb-run -a npx electron --no-sandbox test/score-persistence.ts
import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {app} from "electron";
import {initialLlmState} from "../shared/llmState.ts";
import {llmState} from "../electron/state/llmState.ts";
import {loadScores, saveLevelScore} from "../electron/state/scores.ts";

const savedProfile = app.commandLine.getSwitchValue("score-test-profile");
const profile = savedProfile || await mkdtemp(path.join(tmpdir(), "decision-scores-test-"));
const file = path.join(profile, "scores.json");
app.setPath("userData", profile);
void app.whenReady().then(async () => {
    let exitCode = 0;
    try {
        assert.deepEqual(llmState.state.scores, []);
        await loadScores();
        if (savedProfile) {
            assert.equal(llmState.state.scoreError, undefined);
            assert.deepEqual(llmState.state.scores, JSON.parse(await readFile(file, "utf8")).records);
            return;
        }
        const reopen = () => promisify(execFile)(process.execPath,
            ["--no-sandbox", fileURLToPath(import.meta.url), `--score-test-profile=${profile}`], {timeout: 30_000});
        assert.deepEqual(llmState.state.scores, []);
        const input = {game: "lock" as const, level: 1, modelId: "qwen-0.8b" as const, characters: [20, 30, 40]};
        const [first, other] = await Promise.all([
            saveLevelScore(input), saveLevelScore({...input, modelId: "gemma-q6"})
        ]);
        assert.deepEqual(JSON.parse(await readFile(file, "utf8")).records, [first.record, other.record]);
        await reopen();
        const replay = await saveLevelScore({...input, characters: [30, 40, 50]});
        assert.equal(replay.record.best, first.record.best);
        assert.ok(replay.record.latest < first.record.latest);
        assert.equal(llmState.state.scores.length, 2);
        assert.deepEqual(JSON.parse(await readFile(file, "utf8")).records, [other.record, replay.record]);
        await reopen();
        const corrupted = '{"version":1,"records":[broken';
        await writeFile(file, corrupted);
        llmState.state = {...initialLlmState};
        await loadScores();
        assert.match(llmState.state.scoreError!, /Unable to read/);
        await assert.rejects(saveLevelScore(input), /left untouched/);
        assert.equal(await readFile(file, "utf8"), corrupted);
        console.log("Score persistence: concurrent saves, fresh launches, latest/best scores per model, and corrupt-file protection passed");
    } catch (error) {
        console.error(error);
        exitCode = 1;
    } finally {
        if (!savedProfile)
            await rm(profile, {recursive: true, force: true});
        app.exit(exitCode);
    }
});
