import assert from "node:assert/strict";
import {getLlama} from "node-llama-cpp";
import {createQuestion} from "../shared/decision.ts";
import {gameProbabilities, gameRequest, games, isRoundWon, lockTarget} from "../shared/games.ts";

// Run against a real GGUF; stdout is JSONL so every typed prefix can be inspected.
const modelPath = process.argv[2];
assert.ok(modelPath, "Usage: npm run --silent test:semantic-lock -- /path/to/model.gguf [round] > results.jsonl");
const roundNumber = process.argv[3] == null ? undefined : Number(process.argv[3]);
assert.ok(roundNumber == null || (Number.isInteger(roundNumber) && roundNumber >= 1 && roundNumber <= games.lock.levels[0]!.rounds.length),
    "Round must be 1, 2, or 3");

const samples: {text: string, expected: boolean[], typeCharacters?: boolean, evidenceAt?: number[]}[][] = [
    [
        {text: "My cat is sleeping.", expected: [true, false, false], typeCharacters: true, evidenceAt: [6, 0, 0]},
        {text: "Can you help me with my homework?", expected: [false, true, false]},
        {text: "Hurry up, the train leaves now!", expected: [false, false, true]},
        {text: "Hello, how are you?", expected: [false, false, false]},
        {text: "I do not need any help.", expected: [false, false, false]},
        {text: "Help my dog now!", expected: [true, true, true], typeCharacters: true, evidenceAt: [11, 4, 15]},
        {text: "Please help my cat right now, she is stuck in a burning house!", expected: [true, true, true]},
        {text: "Please rescue the trapped kitten immediately!", expected: [true, true, true]}
    ],
    [
        {text: "Could you give me a ride?", expected: [true, false, false], typeCharacters: true, evidenceAt: [23, 0, 0]},
        {text: "I need to go to the library.", expected: [false, true, false]},
        {text: "I will pay for your fuel.", expected: [false, false, true]},
        {text: "Could you drive me to the library? I can pay for fuel.", expected: [true, true, true],
            typeCharacters: true, evidenceAt: [18, 32, 51]},
        {text: "Could you give me a lift to the station? I will cover the petrol.", expected: [true, true, true]}
    ],
    [
        {text: "Have a cookie.", expected: [true, false, false]},
        {text: "This is a chocolate cookie.", expected: [false, true, false]},
        {text: "I baked these cookies myself.", expected: [false, false, true]},
        {text: "Have a chocolate cookie; I baked them myself.", expected: [true, true, true],
            typeCharacters: true, evidenceAt: [23, 23, 35]},
        {text: "I baked these lemon cookies myself. Please take one.", expected: [true, true, true]}
    ]
];

const llama = await getLlama();
const model = await llama.loadModel({modelPath});
const context = await model.createDecisionContext({contextSize: {max: 4096}, parallelQuestions: 3});
await context.warmup();
let evaluations = 0;
let mismatches = 0;
let falseWins = 0;
const durations: number[] = [];
console.log(JSON.stringify({modelPath, rounds: games.lock.levels[0]!.rounds, lockTarget}));

try {
    for (const [index, round] of games.lock.levels[0]!.rounds.entries()) {
        if (roundNumber != null && roundNumber !== index + 1)
            continue;
        const cases = [
            ...["h", "hello", "The book is on the table.", "asdf", "123", "..."].map((text) => ({
                text, expected: [false, false, false], typeCharacters: text === "hello" || text.startsWith("The book"),
                evidenceAt: undefined as number[] | undefined
            })),
            ...samples[index]!
        ];
        for (const sample of cases) {
            assert.ok(Array.from(sample.text).length <= round.limit);
            const prefixes = sample.typeCharacters
                ? Array.from(sample.text).map((_, index, characters) => characters.slice(0, index + 1).join(""))
                : [sample.text];
            for (const text of prefixes) {
                const request = gameRequest("local:evaluation", round, text);
                const questions = Object.fromEntries([request.input, ...request.additionalInputs ?? []]
                    .map((input, index) => [String(index), createQuestion(input)]));
                const start = performance.now();
                const answers = await context.decide(request.input.document, questions);
                const duration = performance.now() - start;
                const result = {answer: answers["0"]!, additionalAnswers: Object.keys(questions).slice(1)
                    .map((key) => answers[key]!), duration};
                const probabilities = gameProbabilities(result);
                // A prefix may establish a condition before the sentence is finished. Only
                // assert negatives before evidence appears, then assert the complete sentence.
                const expected = sample.expected.map((value, index) => (text === sample.text || !value ? value :
                    text.length < (sample.evidenceAt?.[index] ?? 0) ? false : null));
                const wrong = expected.flatMap((value, index) => (value != null && (probabilities[index]! >= lockTarget) !== value
                    ? [round.labels[index]!] : []));
                const won = isRoundWon("lock", round, text, probabilities);
                const falseWin = won && expected.includes(false);
                evaluations++;
                mismatches += wrong.length;
                falseWins += Number(falseWin);
                durations.push(duration);
                console.log(JSON.stringify({round: index + 1, sample: sample.text, text, expected, probabilities, duration, won, wrong}));
            }
        }
    }
} finally {
    await context.dispose();
    await model.dispose();
    await llama.dispose();
}

durations.sort((a, b) => a - b);
const summary = {modelPath, roundNumber, evaluations, mismatches, falseWins, medianMs: durations[Math.floor(durations.length / 2)]};
console.log(JSON.stringify({summary}));
console.error(summary);
if (mismatches > 0 || falseWins > 0)
    process.exitCode = 1;
