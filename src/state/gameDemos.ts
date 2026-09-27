import type {GameId} from "../../shared/games.ts";

type DemoStep = {text: string, probabilities: number[], caption: string};
export const demoStepDuration = 3000;
export const gameDemos: Record<GameId, {limit: number, steps: DemoStep[]}> = {
    lock: {limit: 40, steps: [
        {text: "My cat", probabilities: [0.9, 0.1, 0.08], caption: "Mention an animal to pass the first threshold."},
        {text: "My cat is stuck.", probabilities: [0.94, 0.32, 0.38], caption: "A problem alone does not ask for help."},
        {text: "My cat is stuck. Please help", probabilities: [0.96, 0.91, 0.42], caption: "Ask for help to open the second lock."},
        {text: "My cat is stuck. Please help now!", probabilities: [0.96, 0.94, 0.92], caption: "Add urgency to get every bar past its target."}
    ]},
    camouflage: {limit: 60, steps: [
        {text: "I absolutely love the cake!", probabilities: [0.86, 0.06, 0.04, 0.04], caption: "Start with praise and watch which category rises."},
        {text: "I absolutely love the cake! I hated", probabilities: [0.72, 0.18, 0.04, 0.06], caption: "Add a contrasting detail to express both meanings."},
        {text: "I absolutely love the cake! I hated the rude service.", probabilities: [0.91, 0.88, 0.04, 0.04], caption: "Get both target bars past their thresholds, and keep the rest low."}
    ]}
};

export function getGameDemoFrame(game: GameId, elapsed: number) {
    const demo = gameDemos[game];
    const index = Math.min(demo.steps.length - 1, Math.floor(Math.max(0, elapsed) / demoStepDuration));
    const step = demo.steps[index]!;
    const previous = demo.steps[index - 1];
    const typed = Math.floor(Math.max(0, elapsed - index * demoStepDuration - 350) / 65);
    const document = step.text.slice(0, (previous?.text.length ?? 0) + typed);
    return {
        document,
        probabilities: document === step.text ? step.probabilities : previous?.probabilities ?? step.probabilities.map(() => 0),
        caption: step.caption
    };
}
