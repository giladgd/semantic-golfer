import {gameRequest, games} from "../../shared/games.ts";
import {models} from "../../shared/models.ts";
import type {DecisionInput, DecisionRequest} from "../../shared/decision.ts";

const playgroundScenes: Array<{
    title: string, description: string, input: DecisionInput, documents: string[], pauseAfter?: string[]
}> = [
    {
        title: "noul", description: "yes/no",
        input: {type: "noul", document: "", instruction: "Does this message ask for a reply?",
            criteria: ["A question or request needs a response", "No response is requested"]},
        documents: ["Thanks for the update", "Thanks for the update.\nCould you confirm the new date?"]
    },
    {
        title: "choice", description: "pick one",
        input: {type: "choice", document: "", instruction: "Which delivery method has the customer chosen?",
            criteria: ["Standard shipping", "Express courier", "Store pickup"]},
        documents: ["I need it delivered as soon as possible", "I prefer to take it in person"]
    },
    {
        title: "score", description: "rate it",
        input: {type: "score", document: "", instruction: "How positive is this review?",
            criteria: ["Negative", "Mixed", "Positive"]},
        documents: ["The food was amazing, but we waited an hour"],
        pauseAfter: ["The food was amazing"]
    }
];

export const golfRound = games.lock.levels[0]!.rounds[0]!;
export const scenes = [...playgroundScenes, {
    title: "Semantic Golfing", description: "play",
    game: "lock" as const,
    documents: ["My cat", "My cat is stuck", "My cat is stuck. Please help now!", "Help my cat now!"]
}];

export function getSceneRequest(scene: typeof scenes[number], document: string): DecisionRequest {
    return "game" in scene ? gameRequest(models[0].id, golfRound, document) :
        {modelId: models[0].id, input: {...scene.input, document}};
}

const movementDuration = 520;
const documentHold = 1_800;
const playButton = ".topBar > nav > button:first-child";
const playgroundButton = ".topBar > nav > button:nth-child(2)";
const gameButton = ".gameChoice:first-child";
const levelButton = ".levels > .level:first-child";
const typeButton = (index: number) => `.typeSwitch > button:nth-child(${index + 1})`;
const keyboard = new Map<string, {x: number, y: number}>();
for (const [y, row] of ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"].entries()) {
    for (const [x, key] of [...row].entries())
        keyboard.set(key, {x: x + [0, 0.25, 0.5, 1][y]!, y});
}
keyboard.set(" ", {x: 5, y: 4});
keyboard.set("\n", {x: 11, y: 2});
for (const [x, key] of [...",.!?"].entries())
    keyboard.set(key, {x: [8, 9, 0, 10][x]!, y: key === "!" ? 0 : 3});

export function typingDelay(previous: string, character: string, addition: number) {
    const from = keyboard.get(previous.toLowerCase()) ?? {x: 5, y: 2};
    const to = keyboard.get(character.toLowerCase()) ?? {x: 5, y: 2};
    return (50 + Math.hypot(to.x - from.x, to.y - from.y) * 7) * (1 + addition);
}

export function getSceneSteps(scene: typeof scenes[number], seed = 0) {
    // Each scene has its own deterministic stream; seeking never changes its rhythm or duration.
    let randomState = (seed + scenes.indexOf(scene)) >>> 0;
    const random = () => {
        randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
        return randomState / 0x100000000;
    };
    const interactionPause = () => 75 + random() * 125;
    const clickPause = () => 75 + random() * 75;
    const game = "game" in scene;
    const index = scenes.indexOf(scene);
    const input = game ? "#gameDocument" : "#documentText";
    const navigation = game ? [
        {from: playButton, to: gameButton, screen: "levels"},
        {from: gameButton, to: levelButton, screen: "round"},
        {from: levelButton, to: input, screen: "round"}
    ] : [{from: index === 0 ? playgroundButton : typeButton(index), to: input, screen: "playground"}];
    let at = 0;
    const moves = navigation.map((move) => {
        const start = at + interactionPause();
        const end = start + movementDuration;
        at = end + clickPause();
        return {...move, at: start, end, clickAt: at};
    });
    const inputClick = at;
    at += interactionPause();
    const typingStart = at;
    const steps = [{at: 0, document: "", selected: false}];
    let previous = "";
    let addition = random() * 0.2;
    for (const document of scene.documents) {
        if (!document.startsWith(previous)) {
            steps.push({at, document: previous, selected: true});
            at += 180;
            previous = "";
            steps.push({at, document: "", selected: false});
            at += 50 + random() * 70;
        }
        for (let length = previous.length + 1; length <= document.length; length++) {
            const text = document.slice(0, length);
            steps.push({at, document: text, selected: false});
            addition = Math.max(0, Math.min(0.2, addition + (random() * 2 - 1) * 0.05));
            at += !game && scene.pauseAfter?.includes(text) ? 2_000 :
                typingDelay(document[length - 1]!, document[length] ?? "", addition);
        }
        previous = document;
        at += documentHold;
    }
    at += 1_000;
    const duration = at + movementDuration + clickPause();
    moves.push({from: input, to: game ? playgroundButton : index === 2 ? playButton : typeButton(index + 1),
        at, end: at + movementDuration, clickAt: duration, screen: game ? "round" : "playground"});
    const revealPause = interactionPause();
    return {
        steps,
        moves: moves.map((move) => ({...move, targetInset: 0.2 + random() * 0.15,
            curve: (random() < 0.5 ? -1 : 1) * (0.03 + random() * 0.03)})),
        inputClick, typingStart, revealPause, duration
    };
}
