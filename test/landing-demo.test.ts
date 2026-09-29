import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";
import {models} from "../shared/models.ts";
import {validateDecisionInput, type DecisionResult} from "../shared/decision.ts";
import {gameProbabilities, isRoundWon, roundScore} from "../shared/games.ts";
import {getSceneRequest, getSceneSteps, golfRound, scenes, typingDelay} from "../site/demo/scenes.ts";
import {advancePlayback, cursorRevealDuration, getDemoDocument, getDemoFrame, playbackState, seekScene, timeline, togglePlayback} from "../site/demo/playback.ts";
import {getCursorPosition, getCursorTarget} from "../site/demo/cursorTarget.ts";
import {createRendererSideBirpc} from "../site/demo/recordedRpc.ts";

test("demo results wait for and display each frame's recorded evaluation duration", async (context) => {
    const data = JSON.parse(await readFile(new URL("../site/demo/recordings.json", import.meta.url), "utf8"));
    const rpc = createRendererSideBirpc();
    context.mock.timers.enable({apis: ["setTimeout", "Date"]});
    for (const [index, scene] of scenes.entries()) {
        for (const frame of data.recordings[index].frames) {
            let completed = false;
            const pending = rpc.evaluateDecision(getSceneRequest(scene, frame.document)).then((result) => {
                completed = true;
                return result;
            });
            context.mock.timers.tick(Math.max(0, Math.floor(frame.measuredDuration) - 1));
            await Promise.resolve();
            assert.equal(completed, false, "Keep the result pending until the recorded duration elapses");
            context.mock.timers.tick(2);
            assert.deepEqual(await pending, {answer: frame.answer, duration: frame.measuredDuration,
                ...(frame.additionalAnswers ? {additionalAnswers: frame.additionalAnswers} : {})});
        }
    }
});

test("every typed demo frame has a real recording from the recommended model", async () => {
    const data = JSON.parse(await readFile(new URL("../site/demo/recordings.json", import.meta.url), "utf8"));
    assert.deepEqual(data.model, models[0]);
    assert.ok(data.modelBytes > 4_000_000_000);
    for (const [index, scene] of scenes.entries()) {
        const recording = data.recordings[index];
        const request = getSceneRequest(scene, "");
        assert.deepEqual(recording.input, request.input, "Recapture results when changing the question or criteria");
        assert.deepEqual(recording.additionalInputs, request.additionalInputs);
        for (const step of timeline[index]!.steps) {
            const document = getDemoDocument(index, step.at);
            const {input} = getSceneRequest(scene, document);
            assert.equal(validateDecisionInput(input), undefined);
            assert.equal(document, step.document);
            const frame = recording.frames.find((frame: {document: string}) => frame.document === document);
            assert.ok(frame, `Missing ${scene.title} recording for ${JSON.stringify(input.document)}`);
            assert.ok(frame.measuredDuration > 0);
            const answer = frame.answer as DecisionResult["answer"];
            assert.equal(answer.type, input.type);
            if (answer.type === "noul")
                assert.ok(answer.value >= 0 && answer.value <= 1);
            else {
                const probabilities = Object.values(answer.probabilities);
                assert.ok(probabilities.every((value) => value >= 0 && value <= 1));
                assert.ok(Math.abs(probabilities.reduce((sum, value) => sum + value, 0) - 1) < 0.00001);
            }
        }
        assert.equal(getDemoDocument(index, timeline[index]!.duration), scene.documents.at(-1));
    }
    const endpoints = scenes.map((scene, index) => scene.documents.map((document) =>
        data.recordings[index].frames.find((frame: {document: string}) => frame.document === document).answer));
    assert.ok(endpoints[0]![0].value < 0.1 && endpoints[0]![1].value > 0.9);
    assert.equal(endpoints[1]![0].choice, "1");
    assert.equal(endpoints[1]![1].choice, "2");
    assert.equal(endpoints[2]!.length, 1);
    const positiveReview = data.recordings[2].frames.find((frame: {document: string}) => frame.document === "The food was amazing");
    assert.ok(endpoints[2]![0].score < positiveReview.answer.score, "The wait makes the review less positive");
    const game = scenes[3]!;
    for (const document of game.documents) {
        const result = data.recordings[3].frames.find((frame: {document: string}) => frame.document === document);
        const won = isRoundWon("lock", golfRound, document, gameProbabilities(result));
        assert.equal(won, document.includes("now!"), document);
    }
    assert.ok(roundScore(golfRound, game.documents.at(-1)!.length) > roundScore(golfRound, game.documents.at(-2)!.length));
});

test("only the first noul playback starts in the Decision panel, including after pausing", () => {
    playbackState.state = {scene: 0, elapsed: 0, playing: true, firstPlay: true};
    const origin = () => {
        const {scene, elapsed, firstPlay} = playbackState.state;
        return getDemoFrame(scene, elapsed, firstPlay).cursor.from;
    };
    assert.equal(origin(), ".decisionResult");
    togglePlayback();
    advancePlayback(100);
    assert.equal(origin(), ".decisionResult");
    togglePlayback();
    advancePlayback(timeline[0]!.moves[0]!.at);
    assert.equal(origin(), ".decisionResult");
    advancePlayback(timeline.reduce((sum, scene) => sum + scene.duration, 0));
    assert.equal(playbackState.state.scene, 0);
    assert.equal(playbackState.state.firstPlay, false);
    assert.equal(origin(), timeline[0]!.moves[0]!.from);
    playbackState.state = {scene: 0, elapsed: 0, playing: true, firstPlay: true};
    seekScene(0);
    assert.equal(playbackState.state.firstPlay, false);
    assert.equal(origin(), timeline[0]!.moves[0]!.from);
    assert.equal(getDemoFrame(0, timeline[0]!.duration, true).cursor.from, "#documentText");
    assert.equal(getDemoFrame(1, 0, true).cursor.from, timeline[1]!.moves[0]!.from);
});

test("demo segments seek, pause, resume, and loop without losing elapsed time", () => {
    seekScene(1);
    assert.deepEqual(playbackState.state, {scene: 1, elapsed: 0, playing: true, firstPlay: false});
    advancePlayback(100);
    togglePlayback();
    advancePlayback(500);
    assert.equal(playbackState.state.elapsed, 100);
    togglePlayback();
    advancePlayback(timeline[1]!.duration);
    assert.deepEqual(playbackState.state, {scene: 2, elapsed: 100, playing: true, firstPlay: false});
    advancePlayback(timeline[2]!.duration);
    assert.deepEqual(playbackState.state, {scene: 3, elapsed: 100, playing: true, firstPlay: false});
    advancePlayback(timeline[3]!.duration);
    assert.deepEqual(playbackState.state, {scene: 0, elapsed: 100, playing: true, firstPlay: false});
    for (let loop = 0; loop < 3; loop++)
        advancePlayback(timeline.reduce((sum, scene) => sum + scene.duration, 0));
    assert.equal(playbackState.state.scene, 0);
    assert.ok(Math.abs(playbackState.state.elapsed - 100) < 0.00001);
    togglePlayback();
    advancePlayback(100_000);
    assert.equal(playbackState.state.playing, false);
});

test("cursor settles before clicking, then holds before moving or typing", () => {
    for (const [scene, timing] of timeline.entries()) {
        const {moves, inputClick, typingStart} = timing;
        assert.equal(getDemoFrame(scene, inputClick - 1).focused, false);
        assert.equal(getDemoFrame(scene, inputClick).focused, true);
        assert.ok(typingStart - inputClick >= 75 && typingStart - inputClick <= 200);
        const hold = getDemoFrame(scene, typingStart - 1);
        assert.equal(hold.cursor.progress, 1);
        assert.equal(hold.cursor.visible, true);
        assert.equal(hold.document, "");
        const typing = getDemoFrame(scene, typingStart);
        assert.ok(typing.document.length > 0 && typing.focused && !typing.cursor.visible);
        for (const move of moves) {
            assert.ok(Math.abs(move.end - move.at - 520) < 0.000001);
            assert.ok(move.clickAt - move.end >= 75 && move.clickAt - move.end <= 150);
            for (const elapsed of [move.end, (move.end + move.clickAt) / 2, move.clickAt - 1]) {
                const beforeClick = getDemoFrame(scene, elapsed);
                assert.equal(beforeClick.cursor.progress, 1, "Remain still until clicking");
                assert.equal(beforeClick.screen, getDemoFrame(scene, move.at).screen, "Do not navigate on arrival");
                assert.equal(beforeClick.focused, getDemoFrame(scene, move.at).focused, "Do not focus on arrival");
            }
        }
        for (const [index, move] of moves.slice(0, -1).entries()) {
            const pause = move.at - (moves[index - 1]?.clickAt ?? 0);
            assert.ok(pause >= 75 && pause <= 200);
            assert.equal(getDemoFrame(scene, move.clickAt).screen, move.screen);
            assert.equal(getDemoFrame(scene, move.clickAt).cursor.progress, 1);
            if (index > 0)
                assert.equal(getDemoFrame(scene, move.at - 1).cursor.progress, 1);
        }
        const end = getDemoFrame(scene, timing.duration);
        const next = getDemoFrame((scene + 1) % scenes.length, 0);
        assert.equal(end.cursor.to, next.cursor.from);
        assert.equal(end.cursor.progress, 1);
        assert.equal(next.cursor.progress, 0);
        const departure = moves.at(-1)!;
        assert.equal(timing.duration, departure.clickAt);
        playbackState.state = {scene, elapsed: departure.end, playing: true, firstPlay: false};
        advancePlayback(departure.clickAt - departure.end - 1);
        assert.equal(playbackState.state.scene, scene, "Keep the scene until its outgoing click");
        advancePlayback(1);
        assert.equal(playbackState.state.scene, (scene + 1) % scenes.length);
    }
    assert.equal(getDemoFrame(3, 0).screen, "games");
    assert.equal(getDemoFrame(3, timeline[3]!.moves[0]!.clickAt - 1).screen, "games");
    assert.equal(getDemoFrame(3, timeline[3]!.moves[0]!.clickAt).screen, "levels");
    assert.equal(getDemoFrame(3, timeline[3]!.moves[1]!.clickAt).screen, "round");
    assert.equal(timeline[3]!.moves.at(-1)!.to, ".topBar > nav > button:nth-child(2)");
});

test("cursor movement starts immediately, rarely overshoots, and settles before the click", () => {
    let overshootingMoves = 0;
    let totalMoves = 0;
    for (const [scene, timing] of timeline.entries()) {
        for (const move of timing.moves) {
            totalMoves++;
            const position = (progress: number) => getDemoFrame(scene, move.at + progress * (move.end - move.at)).cursor.progress;
            assert.equal(position(0), 0);
            assert.ok(position(0.01) > 0.015, "Start moving without an ease-in ramp");
            const positions = Array.from({length: 101}, (_, index) => position(index / 100));
            const peak = Math.max(...positions);
            assert.ok(peak < 1.005, "Keep any overshoot below half a percent");
            if (peak > 1) {
                overshootingMoves++;
                assert.ok(position(0.98) > 1 && position(0.98) < peak);
            } else {
                assert.ok(positions.every((value, index) => index === 0 || value >= positions[index - 1]!));
                assert.ok(position(0.9) < 0.995, "Keep moving decisively near the end instead of slowly gliding");
            }
            assert.equal(position(1), 1);
            assert.equal(getDemoFrame(scene, move.end + 50).cursor.progress, 1);
        }
    }
    assert.ok(overshootingMoves > 0 && overshootingMoves / totalMoves <= 0.25, "Most movements should stop without overshooting");
});

test("cursor paths have a small seeded bow and meet their endpoints exactly", () => {
    const from = {x: 120, y: 80};
    for (const scene of scenes) {
        const timing = getSceneSteps(scene, 12345);
        assert.deepEqual(timing, getSceneSteps(scene, 12345));
        assert.notDeepEqual(timing.moves.map((move) => move.curve), getSceneSteps(scene, 67890).moves.map((move) => move.curve));
        for (const {curve} of timing.moves) {
            assert.ok(Math.abs(curve) >= 0.03 && Math.abs(curve) <= 0.06);
            for (const to of [{x: 132, y: 84}, {x: 900, y: 500}, {x: 0, y: 80}, {x: 120, y: 0}]) {
                assert.deepEqual(getCursorPosition(from, to, 0, curve), from);
                assert.deepEqual(getCursorPosition(from, to, 1, curve), to);
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const distance = Math.hypot(dx, dy);
                for (const progress of [0.1, 0.5, 0.9]) {
                    const point = getCursorPosition(from, to, progress, curve);
                    const offset = {x: point.x - from.x - dx * progress, y: point.y - from.y - dy * progress};
                    const bend = Math.hypot(offset.x, offset.y);
                    assert.ok(bend > 0 && bend <= Math.min(18, distance * 0.06) + 0.000001);
                    assert.ok(Math.abs(offset.x * dx + offset.y * dy) < 0.000001, "Bend across the path, not along it");
                    assert.equal(Math.sign(dx * offset.y - dy * offset.x), Math.sign(curve));
                }
            }
            assert.deepEqual(getCursorPosition(from, from, 0.5, curve), from);
        }
    }
});

test("the hidden cursor makes a small reveal movement, pauses, then heads toward its next target", () => {
    for (const [scene, timing] of timeline.entries()) {
        const departure = timing.moves.at(-1)!;
        const revealAt = departure.at - cursorRevealDuration - timing.revealPause;
        assert.ok(timing.revealPause >= 75 && timing.revealPause <= 200);
        const hidden = getDemoFrame(scene, revealAt - 1).cursor;
        const reveal = getDemoFrame(scene, revealAt).cursor;
        assert.equal(hidden.visible, false);
        assert.equal(reveal.visible, true);
        assert.equal(reveal.from, hidden.to, "Reappear at the last pointer position");
        assert.equal(Math.hypot(reveal.offset.x, reveal.offset.y), 0);
        const nudge = getDemoFrame(scene, revealAt + cursorRevealDuration / 2).cursor;
        assert.equal(nudge.progress, 0, "Make the small movement before taking the main trajectory");
        assert.ok(Math.hypot(nudge.offset.x, nudge.offset.y) > 0 && Math.hypot(nudge.offset.x, nudge.offset.y) < 8);
        for (const progress of [0.1, 0.5, 0.9]) {
            const paused = getDemoFrame(scene, revealAt + cursorRevealDuration + timing.revealPause * progress).cursor;
            assert.equal(paused.visible, true);
            assert.equal(paused.progress, 0);
            assert.deepEqual(paused.offset, {x: 6, y: -3}, "Hold still between revealing and moving toward the target");
        }
        const before = getDemoFrame(scene, departure.at - 0.001).cursor;
        const start = getDemoFrame(scene, departure.at).cursor;
        assert.equal(start.progress, 0);
        assert.ok(Math.hypot(start.offset.x - before.offset.x, start.offset.y - before.offset.y) < 0.001);
        const moving = getDemoFrame(scene, (departure.at + departure.end) / 2).cursor;
        assert.ok(moving.progress > 0 && moving.offset.x < start.offset.x);
        const arrived = getDemoFrame(scene, departure.end).cursor;
        assert.equal(arrived.progress, 1);
        assert.equal(Math.hypot(arrived.offset.x, arrived.offset.y), 0, "Land exactly on the target");
    }
});

test("document replacements select all, delete, and wait a seeded 50-120ms before typing", () => {
    const selectionCounts: number[] = [];
    for (const [scene, timing] of timeline.entries()) {
        const selections = timing.steps.filter((step) => step.selected);
        selectionCounts.push(selections.length);
        for (const selection of selections) {
            const index = timing.steps.indexOf(selection);
            const deleted = timing.steps[index + 1]!;
            const typing = timing.steps[index + 2]!;
            assert.equal(selection.document, timing.steps[index - 1]!.document);
            assert.ok(selection.document.length > 0 && deleted.at > selection.at);
            const selectedFrame = getDemoFrame(scene, deleted.at - 1);
            assert.equal(selectedFrame.document, selection.document);
            assert.equal(selectedFrame.selected, true);
            assert.ok(selectedFrame.focused && !selectedFrame.cursor.visible);
            assert.equal(deleted.document, "");
            assert.equal(deleted.selected, false);
            const delay = typing.at - deleted.at;
            assert.ok(delay >= 50 && delay <= 120);
            assert.equal(getDemoFrame(scene, typing.at - 1).document, "");
            const typedFrame = getDemoFrame(scene, typing.at);
            assert.equal(typedFrame.document.length, 1);
            assert.equal(typedFrame.selected, false);
        }
    }
    assert.deepEqual(selectionCounts, [0, 1, 0, 1], "Select only when replacing text, including choice");
    const first = getSceneSteps(scenes[1]!, 12345);
    const second = getSceneSteps(scenes[1]!, 67890);
    const index = first.steps.findIndex((step) => step.selected);
    assert.deepEqual(first, getSceneSteps(scenes[1]!, 12345));
    assert.notEqual(first.steps[index + 2]!.at - first.steps[index + 1]!.at,
        second.steps[index + 2]!.at - second.steps[index + 1]!.at);
});

test("click targets use the nearest point plus a seeded inset toward the previous aim", () => {
    const bounds = {left: 100, top: 100, right: 300, bottom: 200};
    const aim = {x: 200, y: 150};
    assert.deepEqual(getCursorTarget(aim, bounds, aim, 0.25), aim);
    for (const [from, nearest] of [
        [{x: 0, y: 150}, {x: 100, y: 150}],
        [{x: 400, y: 150}, {x: 300, y: 150}],
        [{x: 200, y: 0}, {x: 200, y: 100}],
        [{x: 200, y: 300}, {x: 200, y: 200}],
        [{x: 0, y: 0}, {x: 100, y: 100}],
        [{x: 140, y: 125}, {x: 140, y: 125}]
    ] as const) {
        for (const inset of [0.2, 0.275, 0.35]) {
            const target = getCursorTarget(from, bounds, aim, inset);
            assert.ok(target.x > bounds.left && target.x < bounds.right && target.y > bounds.top && target.y < bounds.bottom);
            assert.ok(Math.hypot(target.x - from.x, target.y - from.y) < Math.hypot(aim.x - from.x, aim.y - from.y));
            const fraction = Math.hypot(target.x - nearest.x, target.y - nearest.y) / Math.hypot(aim.x - nearest.x, aim.y - nearest.y);
            assert.ok(Math.abs(fraction - inset) < 0.000001);
        }
    }
    for (const scene of scenes) {
        const first = getSceneSteps(scene, 12345).moves.map((move) => move.targetInset);
        assert.ok(first.every((inset) => inset >= 0.2 && inset <= 0.35));
        assert.deepEqual(first, getSceneSteps(scene, 12345).moves.map((move) => move.targetInset));
        assert.notDeepEqual(first, getSceneSteps(scene, 67890).moves.map((move) => move.targetInset));
    }
});

test("the score demo pauses for two seconds before completing its document", () => {
    const {steps} = timeline[2]!;
    const prefix = "The food was amazing";
    const index = steps.findIndex((step) => step.document === prefix);
    assert.ok(index >= 0);
    const paused = steps[index]!;
    const next = steps[index + 1]!;
    assert.ok(Math.abs(next.at - paused.at - 2_000) < 0.000001);
    const frame = getDemoFrame(2, paused.at + 1_999);
    assert.equal(frame.document, prefix);
    assert.ok(frame.focused && !frame.selected && !frame.cursor.visible);
    assert.equal(getDemoDocument(2, next.at), prefix + ",");
    assert.equal(next.selected, false);
});

test("typing rhythm is seeded once, follows key distance, and drifts within the requested bounds", () => {
    assert.ok(typingDelay("q", "p", 0) > typingDelay("q", "w", 0));
    assert.equal(typingDelay("q", "w", 0.2), typingDelay("q", "w", 0) * 1.2);
    for (const scene of scenes) {
        const timing = getSceneSteps(scene, 12345);
        assert.deepEqual(timing, getSceneSteps(scene, 12345));
        assert.notEqual(timing.duration, getSceneSteps(scene, 67890).duration);
        assert.notEqual(timing.revealPause, getSceneSteps(scene, 67890).revealPause);
        assert.deepEqual(timing.steps.map(({document}) => document), getSceneSteps(scene, 67890).steps.map(({document}) => document));
        let lastAddition: number | undefined;
        for (let index = 1; index < timing.steps.length - 1; index++) {
            const step = timing.steps[index]!;
            const next = timing.steps[index + 1]!;
            if (!next.document.startsWith(step.document) || next.document.length !== step.document.length + 1 ||
                scene.documents.includes(step.document) || step.document === "" ||
                (!("game" in scene) && scene.pauseAfter?.includes(step.document))) {
                lastAddition = undefined;
                continue;
            }
            const delay = next.at - step.at;
            const base = typingDelay(step.document.at(-1)!, next.document.at(-1)!, 0);
            const addition = delay / base - 1;
            assert.ok(addition >= -0.000001 && addition <= 0.200001);
            if (lastAddition != null)
                assert.ok(Math.abs(addition - lastAddition) <= 0.050001);
            lastAddition = addition;
        }
        assert.ok(timing.duration > timing.steps.at(-1)!.at);
    }
});
