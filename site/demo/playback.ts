import {State} from "lifecycle-utils";
import {getSceneSteps, scenes} from "./scenes.ts";

const pageSeed = crypto.getRandomValues(new Uint32Array(1))[0]!;
export const cursorRevealDuration = 120;
export const timeline = scenes.map((scene) => getSceneSteps(scene, pageSeed));
export const playbackState = new State({scene: 0, elapsed: 0, playing: true, firstPlay: true}, {queueEvents: false});

export function seekScene(scene: number) {
    playbackState.state = {scene, elapsed: 0, playing: true, firstPlay: false};
}

export function togglePlayback() {
    const {scene, elapsed, playing} = playbackState.state;
    if (elapsed >= timeline[scene]!.duration)
        seekScene(0);
    else
        playbackState.state = {...playbackState.state, playing: !playing};
}

export function advancePlayback(delta: number) {
    const current = playbackState.state;
    if (!current.playing)
        return;
    let {scene, elapsed, firstPlay} = current;
    elapsed += delta;
    while (elapsed >= timeline[scene]!.duration) {
        elapsed -= timeline[scene]!.duration;
        scene = (scene + 1) % scenes.length;
        firstPlay = false;
    }
    playbackState.state = {scene, elapsed, playing: true, firstPlay};
}

export function getDemoDocument(scene: number, elapsed: number) {
    return timeline[scene]!.steps.findLast((step) => step.at <= elapsed)!.document;
}

// Settle briefly on the target before clicking, then wait 75-200ms before the next action.
export function getDemoFrame(scene: number, elapsed: number, firstPlay = false) {
    const {steps, moves, inputClick, typingStart, revealPause} = timeline[scene]!;
    const step = steps.findLast((step) => step.at <= elapsed)!;
    const departure = moves.at(-1)!;
    const revealAt = departure.at - cursorRevealDuration - revealPause;
    const move = elapsed >= revealAt ? departure : moves.findLast((move) => move.at <= elapsed) ?? moves[0]!;
    const from = firstPlay && scene === 0 && move === moves[0] ? ".decisionResult" : move.from;
    const screen = moves.findLast((move) => move.clickAt <= elapsed)?.screen ??
        ("game" in scenes[scene]! ? "games" : "playground");
    const progress = Math.min(1, Math.max(0, (elapsed - move.at) / (move.end - move.at)));
    const remaining = 1 - progress;
    // A quadratic ease-out avoids a long, slow glide; only occasional document approaches overshoot.
    const overshoot = scene % 2 === 0 && move.to === "#documentText" ? 0.12 : 0;
    const position = 1 - remaining ** 2 + overshoot * progress * remaining;
    // Wake the pointer near its resting point, then carry that offset into the main movement.
    const startOffset = move === departure ? {x: 6, y: -3} : {x: 0, y: 0};
    const nudge = Math.min(1, Math.max(0, (elapsed - revealAt) / cursorRevealDuration)) * (1 - position);
    return {
        document: step.document, selected: step.selected, screen, focused: elapsed >= inputClick,
        cursor: {from, to: move.to, progress: position, curve: move.curve, targetInset: move.targetInset, startOffset,
            offset: {x: startOffset.x * nudge, y: startOffset.y * nudge},
            visible: elapsed < typingStart || elapsed >= revealAt}
    };
}
