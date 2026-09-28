import assert from "node:assert/strict";
import {test} from "node:test";
import {characterCount, gameProbabilities, gameRequest, games, isRoundWon, type GameId} from "../shared/games.ts";
import {validateDecisionRequest} from "../shared/decision.ts";
import {getDownloadProgress, initialLlmState} from "../shared/llmState.ts";
import {dismissGameHelp, hasSeenGameHelp} from "../src/state/gameHelpState.ts";

test("game rounds enforce their character budget and semantic targets", () => {
    for (const id of Object.keys(games) as GameId[]) {
        for (const round of games[id].levels.flatMap(({rounds}) => rounds)) {
            const request = gameRequest("qwen-0.8b", round, "A sentence");
            assert.equal(validateDecisionRequest(request), undefined);
            assert.equal((request.additionalInputs?.length ?? 0) + 1, round.labels.length);
            assert.equal(request.input.document, 'Text: "A sentence"');
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
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.7, 0.7, 0.69, 0.69]), true);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.7, 0.3, 0, 0]), false);
    assert.equal(isRoundWon("signalMixing", signalMixing, "Mixed feelings", [0.4, 0.4, 0.1, 0.1]), false);
    assert.deepEqual(gameProbabilities("lock", {
        answer: {type: "noul", value: 0.9}, additionalAnswers: [{type: "noul", value: 0.8}], duration: 1
    }), [0.9, 0.8]);
    assert.deepEqual(gameProbabilities("signalMixing", {
        answer: {type: "choice", choice: "1", confidence: 0.9, probabilities: {"0": 0.1, "1": 0.9}},
        additionalAnswers: [{type: "choice", choice: "0", confidence: 0.8, probabilities: {"0": 0.8, "1": 0.2}}],
        duration: 1
    }), [0.9, 0.2]);
    const request = gameRequest("qwen-0.8b", lock, "One document");
    request.additionalInputs![0]!.document = "Another document";
    assert.match(validateDecisionRequest(request)!, /same document/);
    request.additionalInputs = Array.from({length: 7}, () => request.input);
    assert.match(validateDecisionRequest(request)!, /at most seven/);
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
