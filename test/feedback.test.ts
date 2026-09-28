import assert from "node:assert/strict";
import {test} from "node:test";
import {games, type GameId} from "../shared/games.ts";
import {getRoundFeedback} from "../shared/feedback.ts";
import {feedbackStyles, levelFeedback, roundFeedback} from "../shared/feedback/messages.ts";

test("every level and round has authored feedback without trailing punctuation", () => {
    for (const game of Object.keys(games) as GameId[]) {
        assert.equal(levelFeedback[game].length, games[game].levels.length);
        assert.equal(roundFeedback[game].length, games[game].levels.length);
        for (const level of games[game].levels) {
            const messages = Object.values(levelFeedback[game][level.id - 1]!);
            assert.equal(messages.length, feedbackStyles.length);
            assert.ok(new Set(messages).size >= 10);
            const rounds = roundFeedback[game][level.id - 1]!;
            assert.equal(rounds.length, level.rounds.length);
            for (const message of [...messages, ...rounds]) {
                assert.ok(message.trim().length > 0);
                assert.doesNotMatch(message, /[.!?]/);
            }
            for (const round of level.rounds) {
                const values = round.labels.map((_, index) => (game === "lock" || index < 2 ? 0.95 : 0.05));
                assert.ok(getRoundFeedback(game, level, round, "A winning answer", values, 10_000));
                assert.equal(getRoundFeedback(game, level, round, "", values, 10_000), undefined);
                assert.equal(getRoundFeedback(game, level, round, "x".repeat(round.limit + 1), values, 10_000), undefined);
                values[0] = 0.69;
                assert.equal(getRoundFeedback(game, level, round, "A failing answer", values, 10_000), undefined);
            }
        }
    }
});

test("feedback responds to brevity, solve time, balanced bars and close thresholds", () => {
    const level = games.lock.levels[0]!;
    const round = level.rounds[0]!;
    const messages = levelFeedback.lock[0]!;
    // A nonzero variation exercises the style-specific copy directly.
    const short = "xx";
    const medium = "x".repeat(Math.ceil(round.limit * 0.6)) + "a";
    const feedback = (text: string, values: number[], time: number) => getRoundFeedback("lock", level, round, text, values, time);
    assert.equal(feedback(short, [0.95, 0.95, 0.95], 1000), messages.compactQuick);
    assert.equal(feedback(short, [0.95, 0.95, 0.95], 90_000), messages.compactClear);
    assert.equal(feedback(short, [0.75, 0.9, 0.85], 90_000), messages.compact);
    assert.equal(feedback(medium, [0.95, 0.95, 0.95], 1000), messages.quickClear);
    assert.equal(feedback(medium, [0.8, 0.9, 0.85], 1000), messages.quick);
    assert.equal(feedback(medium, [0.8, 0.9, 0.85], 180_000), messages.persistent);
    assert.equal(feedback(medium, [0.95, 0.95, 0.95], 90_000), messages.clear);
    assert.equal(feedback(medium, [0.8, 0.8, 0.8], 90_000), messages.balanced);
    assert.equal(feedback(short, [0.71, 0.95, 0.95], 1000), messages.close);
    assert.equal(feedback("🐈".repeat(Math.floor(round.limit * 0.4)), [0.95, 0.95, 0.95], 1000), messages.compactQuick);
    assert.equal(feedback(medium, [0.95, 0.95, 0.95], 90_000), feedback(medium, [0.95, 0.95, 0.95], 90_000));

    const blendLevel = games.signalMixing.levels[0]!;
    const blendRound = blendLevel.rounds[0]!;
    const values = [0.95, 0.95, 0.695, 0.05];
    assert.equal(getRoundFeedback("signalMixing", blendLevel, blendRound, "xxx", values, 1000),
        `${blendRound.labels[2]} kept below the line`);
    values[2] = 0.7;
    assert.equal(getRoundFeedback("signalMixing", blendLevel, blendRound, "xxx", values, 1000), undefined);
});
