import assert from "node:assert/strict";
import {test} from "node:test";
import {demoStepDuration, gameDemos, getGameDemoFrame} from "../src/state/gameDemos.ts";
import {games, isRoundWon, type GameId} from "../shared/games.ts";

test("tutorials type complete examples within the budget and finish on valid game targets", () => {
    for (const game of Object.keys(gameDemos) as GameId[]) {
        const demo = gameDemos[game];
        const round = {...games[game].levels[0]!.rounds[0]!, limit: demo.limit};
        const duration = demo.steps.length * demoStepDuration;
        let previousText = "";
        for (const step of demo.steps) {
            assert.ok(step.text.startsWith(previousText));
            assert.equal(step.probabilities.length, round.labels.length);
            assert.ok(step.probabilities.every((value) => value >= 0 && value <= 1));
            previousText = step.text;
        }
        previousText = "";
        for (let elapsed = 0; elapsed <= duration; elapsed += 65) {
            const frame = getGameDemoFrame(game, elapsed);
            assert.ok(frame.document.startsWith(previousText));
            assert.ok(frame.document.length <= demo.limit);
            assert.equal(isRoundWon(game, round, frame.document, frame.probabilities), frame.document === demo.steps.at(-1)!.text);
            previousText = frame.document;
        }
        assert.equal(getGameDemoFrame(game, -100).document, "");
        const final = getGameDemoFrame(game, duration);
        assert.equal(final.document, demo.steps.at(-1)!.text);
        assert.ok(isRoundWon(game, round, final.document, final.probabilities));
        assert.deepEqual(getGameDemoFrame(game, duration + 5000), final);
    }
});
