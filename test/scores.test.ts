import assert from "node:assert/strict";
import {test} from "node:test";
import {characterCount, games, levelScore, roundScore, type GameId} from "../shared/games.ts";
import {addLevelScore, gameTotal, getLatestScore, getScore, readScoreRecords} from "../shared/scores.ts";
import {maxDecisionQuestions} from "../shared/decision.ts";
import {semanticGolfingCases} from "./fixtures/semantic-golfing.ts";
import {levelSolutions} from "./fixtures/level-solutions.ts";
import {signalMixingCases} from "./fixtures/signal-mixing.ts";

test("both games have a complete progression and reference answers for every round", () => {
    for (const game of Object.keys(games) as GameId[]) {
        const levels = games[game].levels;
        assert.deepEqual(levels.map(({id}) => id), Array.from({length: 11}, (_, index) => index + 1));
        assert.equal(levels.at(-1)!.rounds.length, 8);
        const ids = new Set<string>();
        for (const level of levels) {
            assert.ok(level.rounds.length >= 3);
            for (const round of level.rounds) {
                assert.ok(!ids.has(round.id));
                ids.add(round.id);
                assert.ok(round.labels.length >= 3 && round.labels.length <= maxDecisionQuestions);
                assert.equal(round.questions.length, round.labels.length);
                assert.equal(new Set(round.labels).size, round.labels.length);
                assert.ok(levelSolutions[game][round.id]!.length >= 2);
                const nearMiss = game === "signalMixing" ? signalMixingCases[round.id]!.nearMisses[0]! : semanticGolfingCases[round.id]!.parts[0]!;
                assert.ok(characterCount(nearMiss) <= round.limit);
                for (const text of levelSolutions[game][round.id]!)
                    assert.ok(characterCount(text) <= round.limit, `${game}/${round.id}: ${text}`);
            }
        }
        assert.deepEqual([...ids].sort(), Object.keys(levelSolutions[game]).sort());
    }
});

test("the latest played model is selected by completion time for the same game and level", () => {
    const input = {modelId: "qwen-0.8b" as const, game: "lock" as const, level: 1, characters: [30, 40, 50]};
    const older = {...addLevelScore([], input, "Qwen").record, completedAt: "2026-09-26T01:00:00Z"};
    const newer = {...addLevelScore([], {...input, modelId: "gemma-q8"}, "Gemma").record,
        completedAt: "2026-09-25T23:00:00-04:00"};
    const records = [newer, {...older, game: "signalMixing" as const}, {...older, level: 2}, older];
    assert.equal(getLatestScore(records, "lock", 1), newer);
    assert.equal(getLatestScore(records, "lock", 3), undefined);
    assert.equal(getLatestScore([], "lock", 1), undefined);
    assert.equal(getScore(records, "qwen-0.8b", "lock", 1), older);
    assert.equal(records[0], newer, "Lookup must not reorder saved scores");
});

test("scores reward shorter answers, retain best scores, and stay separate per model, game, and level", () => {
    const level = games.lock.levels[0]!;
    const characters = [30, 40, 50];
    const input = {modelId: "qwen-0.8b" as const, game: "lock" as const, level: 1, characters};
    const first = addLevelScore([], input, "Qwen");
    assert.equal(first.previousBest, 0);
    assert.equal(first.record.latest, levelScore(level, characters));
    assert.equal(first.record.best, first.record.latest);
    const replay = addLevelScore([first.record], {...input, characters: [40, 50, 60]}, "Qwen");
    assert.ok(replay.record.latest < first.record.latest);
    assert.equal(replay.record.best, first.record.best);
    const improved = addLevelScore([replay.record], {...input, characters: [20, 30, 40]}, "Qwen");
    assert.ok(improved.record.best > first.record.best);
    assert.equal(improved.record.latest, improved.record.best);
    const otherModel = addLevelScore([first.record], {...input, modelId: "gemma-q8"}, "Gemma").record;
    const otherGame = addLevelScore([first.record], {...input, game: "signalMixing"}, "Qwen").record;
    const otherLevel = addLevelScore([first.record], {...input, level: 2}, "Qwen").record;
    const records = [first.record, otherModel, otherGame, otherLevel];
    assert.equal(gameTotal(records, "qwen-0.8b", "lock"), first.record.best + otherLevel.best);
    assert.equal(gameTotal(records, "qwen-2b", "lock"), 0);
    assert.equal(getScore(records, "gemma-q8", "lock", 1), otherModel);
    assert.deepEqual(readScoreRecords(JSON.parse(JSON.stringify({version: 1, records}))), records);
    const legacyRecord = {...otherGame, game: "camouflage"};
    assert.deepEqual(readScoreRecords({version: 1, records: [legacyRecord]}), [otherGame]);
    assert.throws(() => readScoreRecords({version: 1, records: [legacyRecord, otherGame]}), /duplicate scores/);
    assert.equal(roundScore(level.rounds[0]!, level.rounds[0]!.limit), 1);
    for (const count of [0, -1, 1.5, NaN, Infinity, level.rounds[0]!.limit + 1])
        assert.throws(() => roundScore(level.rounds[0]!, count));
    assert.throws(() => levelScore(level, [10]));
    assert.throws(() => addLevelScore([], {...input, level: 12}, "Qwen"));
    assert.throws(() => readScoreRecords({version: 2, records}));
    assert.throws(() => readScoreRecords({version: 1, records: [first.record, first.record]}));
    assert.throws(() => readScoreRecords({version: 1, records: [{...first.record, best: -1}]}));
    assert.throws(() => readScoreRecords({version: 1, records: [{...first.record, modelId: "unknown"}]}));
});
