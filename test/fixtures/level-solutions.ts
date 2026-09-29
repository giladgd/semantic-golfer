import {semanticGolfingCases} from "./semantic-golfing.ts";
import {signalMixingCases} from "./signal-mixing.ts";
import {signalMixingParts} from "./signal-mixing-parts.ts";
import {gameParaphrases} from "./game-paraphrases.ts";
import type {GameId} from "../../shared/games.ts";

// Natural reference answers, kept out of the shipped application. Alternatives are
// deliberate rewrites, not punctuation tricks or instructions aimed at the model.
export const levelSolutions: Record<GameId, Record<string, string[]>> = {
    lock: Object.fromEntries(Object.entries(semanticGolfingCases)
        .map(([id, {parts, alternatives}]) => [id, [...new Set([
            parts.join(" "), ...alternatives ?? [], ...gameParaphrases.lock[id]!
        ])]])),
    signalMixing: Object.fromEntries(Object.entries(signalMixingCases)
        .map(([id, {solutions}]) => [id, [...new Set([
            ...solutions, signalMixingParts[id]!.join(" "), ...gameParaphrases.signalMixing[id]!
        ])]]))
};
