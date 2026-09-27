import {camouflageTarget, characterCount, isRoundWon, lockTarget, type GameId, type GameLevel, type GameRound} from "./games.ts";
import {levelFeedback, roundFeedback, type FeedbackStyle} from "./feedback/messages.ts";

export function getRoundFeedback(
    game: GameId, level: GameLevel, round: GameRound, document: string,
    probabilities: number[], elapsed: number
) {
    if (!isRoundWon(game, round, document, probabilities))
        return undefined;
    const ratio = characterCount(document) / round.limit;
    const targets = game === "lock" ? probabilities : probabilities.slice(0, 2);
    const margins = probabilities.map((value, index) => (game === "lock" ? value - lockTarget :
        index < 2 ? value - camouflageTarget.min : camouflageTarget.other - value));
    const closest = Math.min(...margins);
    const clear = closest >= 0.18;
    const compact = ratio <= 0.45;
    const quick = elapsed <= (25 + round.labels.length * 6) * 1000;
    const balanced = Math.max(...targets) - Math.min(...targets) <= 0.06 && closest >= 0.08;
    const index = level.rounds.indexOf(round);
    let style: FeedbackStyle;
    if (closest < 0.035) style = "close";
    else if (compact && quick) style = "compactQuick";
    else if (compact && clear) style = "compactClear";
    else if (compact) style = "compact";
    else if (quick && clear) style = "quickClear";
    else if (quick) style = "quick";
    else if (elapsed >= 150_000) style = "persistent";
    else if (clear) style = "clear";
    else if (balanced) style = "balanced";
    else if (ratio > 0.82) style = "detailed";
    else if (index === level.rounds.length - 1) style = "finish";
    else style = "steady";

    // Stable for the same answer; edits can earn a different observation without random flicker.
    const variation = Array.from(document).reduce((sum, character) => sum + character.codePointAt(0)!, index) % 3;
    if (variation === 0 && ["clear", "steady", "finish"].includes(style))
        return roundFeedback[game][level.id - 1]![index]!;
    if (variation === 0 && style === "balanced")
        return game === "lock" ? `All ${targets.length} conditions in balance` : `${round.labels[0]} and ${round.labels[1]} in balance`;
    if (variation === 0 && style === "close" && game === "camouflage") {
        const tightest = margins.indexOf(closest);
        return `${round.labels[tightest]} ${tightest < 2 ? "just over" : "kept below"} the line`;
    }
    return levelFeedback[game][level.id - 1]![style];
}
