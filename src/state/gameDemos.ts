import type {GameId} from "../../shared/games.ts";

type DemoStep = {text: string, probabilities: number[], caption: string};
export const demoStepDuration = 3000;
export const gameDemos: Record<GameId, {limit: number, steps: DemoStep[]}> = {
    lock: {limit: 40, steps: [
        {text: "My cat", probabilities: [0.9, 0.1, 0.08], caption: "Mention an animal to pass the first threshold"},
        {text: "My cat is stuck", probabilities: [0.94, 0.32, 0.38], caption: "A problem alone does not ask for help"},
        {text: "My cat is stuck. Please help", probabilities: [0.96, 0.91, 0.42], caption: "Ask for help to open the second lock"},
        {text: "My cat is stuck. Please help now!", probabilities: [0.96, 0.94, 0.92], caption: "Add urgency to get every bar past its target"}
    ]},
    // Recorded with Gemma 4 5B E2B Q8_0 against the first round's questions.
    signalMixing: {limit: 150, steps: [
        {text: "Could I", probabilities: [0.000261, 0.000003, 0.012399, 0.000248], caption: "Start a request"},
        {text: "Could I borrow your charger?", probabilities: [0.999998, 0.000002, 0.001228, 0.000051], caption: "Ask for the charger; a little thanks is still missing"},
        {text: "Could I borrow your charger? Thanks", probabilities: [0.999998, 0.999446, 0.001262, 0.000070], caption: "Add thanks while keeping entitlement and ultimatums low"}
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
