import {State} from "lifecycle-utils";
import type {GameId} from "../../shared/games.ts";

export const gameHelpState = new State<GameId | undefined>(undefined);
const seenGames = new Set<GameId>();

export function hasSeenGameHelp(game: GameId) {
    if (seenGames.has(game))
        return true;
    try {
        return localStorage.getItem(`game-help:${game}`) === "seen";
    } catch {
        return false;
    }
}

export function dismissGameHelp(game: GameId) {
    seenGames.add(game);
    try {
        localStorage.setItem(`game-help:${game}`, "seen");
    } catch {
        // Keep the dismissal for this session if storage is unavailable.
    }
    gameHelpState.state = undefined;
}
