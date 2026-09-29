import assert from "node:assert/strict";
import {test} from "node:test";
import {characterCount, gameProbabilities, gameRequest, games, isRoundWon, type GameId} from "../shared/games.ts";
import {getGameMeterDescriptions} from "../shared/gameDescriptions.ts";
import {maxDecisionQuestions, validateDecisionRequest} from "../shared/decision.ts";
import {getDownloadProgress, initialLlmState} from "../shared/llmState.ts";
import {dismissGameHelp, hasSeenGameHelp} from "../src/state/gameHelpState.ts";
import {signalMixingCases, signalRiskAdditions} from "./fixtures/signal-mixing.ts";
import {signalMixingParts} from "./fixtures/signal-mixing-parts.ts";
import {semanticGolfingCases} from "./fixtures/semantic-golfing.ts";
import {gameParaphrases} from "./fixtures/game-paraphrases.ts";

test("game bars have optional, concise help without examples or model instructions", () => {
    for (const game of Object.keys(games) as GameId[]) {
        for (const {rounds} of games[game].levels) {
            for (const round of rounds) {
                const descriptions = getGameMeterDescriptions(game, round);
                assert.equal(descriptions.length, round.labels.length);
                for (const description of descriptions) {
                    if (description == null)
                        continue;
                    assert.ok(description.length > 15 && description.length <= 100, `${game}/${round.id}: keep help concise`);
                    assert.doesNotMatch(description, /Answer yes|Classify only|quoted Text|requirement below|Which description/);
                    assert.doesNotMatch(description, /What does the message establish|Judge (only|the)|match this description/);
                    assert.doesNotMatch(description, /such as|for example|e\.g\.|\.\s*$/i);
                }
                assert.deepEqual(getGameMeterDescriptions(game, {...round, questions: []}), descriptions,
                    "Player help must not fall back to evaluation prompts or criteria");
            }
        }
    }
    for (const round of games.lock.levels[0]!.rounds)
        assert.ok(getGameMeterDescriptions("lock", round).every((description) => description == null),
            "Self-explanatory beginner goals do not need help icons");
    const cinema = games.lock.levels[10]!.rounds[0]!;
    const descriptions = getGameMeterDescriptions("lock", cinema);
    assert.equal(cinema.labels[3], "State the ticket price or free entry");
    assert.match(descriptions[3]!, /Admission cost/);
    assert.equal(cinema.labels[4], "Describe an accessibility feature");
    assert.match(descriptions[4]!, /access needs/);
    assert.doesNotMatch(descriptions[4]!, /step-free|wheelchair|captions/);
    const dinner = games.signalMixing.levels[1]!.rounds[1]!;
    assert.match(getGameMeterDescriptions("signalMixing", dinner)[2]!, /replacement activity or occasion/);
    const bill = games.signalMixing.levels[8]!.rounds[5]!;
    assert.doesNotMatch(getGameMeterDescriptions("signalMixing", bill)[0]!, /\d/, "Do not solve the shared bill for the player");
});

test("game rounds enforce their character budget and semantic targets", () => {
    for (const id of Object.keys(games) as GameId[]) {
        for (const round of games[id].levels.flatMap(({rounds}) => rounds)) {
            const request = gameRequest("qwen-0.8b", round, "A sentence");
            assert.equal(validateDecisionRequest(request), undefined);
            assert.equal((request.additionalInputs?.length ?? 0) + 1, round.labels.length);
            assert.equal(request.input.document, 'Text: "A sentence"');
            const paraphrases = gameParaphrases[id][round.id]!;
            assert.ok(paraphrases.length >= 2, `${id}/${round.id}: cover multiple natural phrasings`);
            for (const text of paraphrases)
                assert.ok(characterCount(text) <= round.limit, `${id}/${round.id}: paraphrase exceeds the character limit`);
        }
    }
    const lock = games.lock.levels[0]!.rounds[0]!;
    assert.equal(isRoundWon("lock", lock, "Help my cat now!", [0.7, 1, 0.9]), true);
    for (const values of [[0.69, 1, 1], [1, 1], [1, 1, NaN]])
        assert.equal(isRoundWon("lock", lock, "Help my cat now!", values), false);
    assert.equal(isRoundWon("lock", lock, " ", [1, 1, 1]), false);
    assert.equal(isRoundWon("lock", lock, "x".repeat(lock.limit + 1), [1, 1, 1]), false);
    assert.equal(characterCount("🐈!"), 2);
    assert.equal(isRoundWon("lock", lock, "🐈".repeat(lock.limit), [1, 1, 1]), true);

    const signalMixing = games.signalMixing.levels[0]!.rounds[0]!;
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.85, 0.85, 0.05, 0.05]), true);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.7, 0.7, 0.59, 0.59]), true);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.7, 0.7, 0.6, 0.59]), false);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.7, 0.3, 0, 0]), false);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.4, 0.4, 0.1, 0.1]), false);
    const dinner = games.signalMixing.levels[1]!.rounds[1]!;
    assert.equal(dinner.goalCount, 3);
    const dinnerValues = dinner.labels.map((_, index) => (index < 3 ? 0.9 : 0.1));
    assert.equal(isRoundWon("signalMixing", dinner, "A complete invitation response", dinnerValues), true);
    dinnerValues[2] = 0.2;
    assert.equal(isRoundWon("signalMixing", dinner, "No alternative offered", dinnerValues), false);
    dinnerValues[2] = 0.9;
    dinnerValues[3] = 0.6;
    assert.equal(isRoundWon("signalMixing", dinner, "An apology", dinnerValues), false);
    assert.deepEqual(gameProbabilities({
        answer: {type: "noul", value: 0.9}, additionalAnswers: [{type: "noul", value: 0.8}], duration: 1
    }), [0.9, 0.8]);
    assert.deepEqual(gameProbabilities({
        answer: {type: "choice", choice: "1", confidence: 0.9, probabilities: {"0": 0.1, "1": 0.9}},
        additionalAnswers: [{type: "choice", choice: "0", confidence: 0.8, probabilities: {"0": 0.8, "1": 0.2}}, {type: "noul", value: 0.3}],
        duration: 1
    }), [0.9, 0.2, 0.3]);
    const request = gameRequest("qwen-0.8b", lock, "One document");
    request.additionalInputs![0]!.document = "Another document";
    assert.match(validateDecisionRequest(request)!, /same document/);
    request.additionalInputs = Array.from({length: maxDecisionQuestions}, () => request.input);
    assert.match(validateDecisionRequest(request)!, /at most 16/);
});

test("Signal Mixing recognizes previous tutorial dismissals and saves the new game ID", (t) => {
    const stored = new Map<string, string>();
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {configurable: true, value: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value)
    }});
    t.after(() => {
        if (originalStorage)
            Object.defineProperty(globalThis, "localStorage", originalStorage);
        else
            Reflect.deleteProperty(globalThis, "localStorage");
    });
    assert.equal(hasSeenGameHelp("signalMixing"), false);
    stored.set("game-help:camouflage", "seen");
    assert.equal(hasSeenGameHelp("signalMixing"), true);
    assert.equal(hasSeenGameHelp("lock"), false);
    stored.clear();
    stored.set("game-help:signalMixing", "seen");
    assert.equal(hasSeenGameHelp("signalMixing"), true);
    stored.clear();
    dismissGameHelp("signalMixing");
    assert.equal(stored.get("game-help:signalMixing"), "seen");
});

test("Signal Mixing increases its writing budget and has reference and counterexample coverage for every brief", () => {
    const levels = games.signalMixing.levels;
    assert.equal(levels.length, 11);
    assert.equal(levels.at(-1)!.rounds.length, 8);
    assert.equal(levels.flatMap(({rounds}) => rounds).length, 52);
    let previousLimit = 0;
    for (const level of levels) {
        assert.ok(level.rounds.every(({limit}) => limit > previousLimit));
        previousLimit = Math.max(...level.rounds.map(({limit}) => limit));
        for (const round of level.rounds) {
            assert.ok(round.brief?.trim());
            assert.ok(round.labels.length >= 4 && round.labels.length <= maxDecisionQuestions);
            assert.ok(Number.isInteger(round.goalCount) && round.goalCount >= 2 && round.goalCount < round.labels.length);
            const cases = signalMixingCases[round.id]!;
            const parts = signalMixingParts[round.id]!;
            assert.equal(parts.length, round.goalCount, `${round.id}: every goal needs an omission case`);
            assert.ok(characterCount(parts.join(" ")) <= round.limit, `${round.id}: the complete example must fit`);
            assert.equal(new Set(parts).size, parts.length, `${round.id}: independent details must be removable`);
            for (const [label, text] of Object.entries(cases.omissions ?? {})) {
                assert.ok(round.labels.slice(0, round.goalCount).includes(label), `${round.id}: unknown omitted goal ${label}`);
                assert.ok(characterCount(text) <= round.limit, `${round.id}: omission counterexample must fit`);
            }
            assert.ok(cases.solutions.length > 0);
            assert.ok(cases.nearMisses.length >= 2);
            for (const text of cases.solutions)
                assert.ok(characterCount(text) <= round.limit, `${round.id}: reference must fit`);
            for (const label of round.labels.slice(round.goalCount)) {
                assert.ok(signalRiskAdditions[label], `Missing risk counterexample for ${label}`);
                assert.ok(characterCount(`${cases.solutions[0]} ${signalRiskAdditions[label]}`) <= round.limit,
                    `${round.id}: risk counterexample must fit so it tests meaning, not the character limit`);
            }
        }
    }
});

test("Semantic Golfing uses distinct short briefs and positive goals with complete reference coverage", () => {
    const levels = games.lock.levels;
    const rounds = levels.flatMap(({rounds}) => rounds);
    assert.equal(levels.length, 11);
    assert.equal(rounds.length, 51);
    assert.equal(levels.at(-1)!.rounds.length, 8);
    assert.equal(new Set(rounds.map(({questions}) => JSON.stringify(questions))).size, rounds.length);
    for (const round of rounds) {
        assert.ok(round.brief && round.brief.length <= 190, `${round.id}: keep the brief short`);
        assert.equal(round.goalCount, round.labels.length);
        assert.ok(round.goalCount >= 3 && round.goalCount <= 7);
        const {parts, alternatives, omissions} = semanticGolfingCases[round.id]!;
        assert.equal(parts.length, round.goalCount);
        for (const text of [parts.join(" "), ...alternatives ?? [], ...Object.values(omissions ?? {})])
            assert.ok(characterCount(text) <= round.limit, `${round.id}: reference must fit`);
        for (const label of Object.keys(omissions ?? {}))
            assert.ok(round.labels.includes(label), `${round.id}: unknown omitted goal ${label}`);
    }
});

test("model download progress is byte-weighted", () => {
    assert.deepEqual(getDownloadProgress(initialLlmState), {count: 0, progress: undefined});
    const state = {...initialLlmState, models: {
        "qwen-0.8b": {downloaded: false, download: {status: "downloading" as const, downloadedSize: 50, totalSize: 100}},
        "qwen-2b": {downloaded: false, download: {status: "downloading" as const, downloadedSize: 100, totalSize: 300}}
    }};
    assert.deepEqual(getDownloadProgress(state), {count: 2, progress: 0.375});
    state.models["qwen-2b"].download.totalSize = 0;
    assert.deepEqual(getDownloadProgress(state), {count: 2, progress: undefined});
});
