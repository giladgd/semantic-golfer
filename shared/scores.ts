import {games, levelScore, type GameId} from "./games.ts";
import {models, type ModelId} from "./models.ts";

export type LevelScoreInput = {modelId: ModelId, game: GameId, level: number, characters: number[]};
export type ScoreRecord = {
    modelId: ModelId, modelName: string, game: GameId, level: number,
    latest: number, best: number, completedAt: string
};
export type SavedLevelScore = {record: ScoreRecord, previousBest: number};

export function getScore(records: ScoreRecord[], modelId: ModelId, game: GameId, level: number) {
    return records.find((record) => record.modelId === modelId && record.game === game && record.level === level);
}

export function getLatestScore(records: ScoreRecord[], game: GameId, level: number) {
    let latest: ScoreRecord | undefined;
    for (const record of records) {
        if (record.game === game && record.level === level &&
            (latest == null || Date.parse(record.completedAt) > Date.parse(latest.completedAt)))
            latest = record;
    }
    return latest;
}

export function gameTotal(records: ScoreRecord[], modelId: ModelId, game: GameId) {
    return records.filter((record) => record.modelId === modelId && record.game === game)
        .reduce((sum, record) => sum + record.best, 0);
}

export function addLevelScore(records: ScoreRecord[], input: LevelScoreInput, modelName: string): SavedLevelScore {
    if (input == null || !Object.hasOwn(games, input.game) || !Number.isInteger(input.level) ||
        typeof input.modelId !== "string" || !Array.isArray(input.characters))
        throw new Error("Invalid level score.");
    const level = games[input.game].levels.find(({id}) => id === input.level);
    if (level == null)
        throw new Error("Unknown level.");
    const latest = levelScore(level, input.characters);
    const previousBest = getScore(records, input.modelId, input.game, input.level)?.best ?? 0;
    return {previousBest, record: {
        modelId: input.modelId, modelName, game: input.game, level: input.level,
        latest, best: Math.max(previousBest, latest), completedAt: new Date().toISOString()
    }};
}

export function readScoreRecords(data: unknown): ScoreRecord[] {
    if (data == null || typeof data !== "object" || !("version" in data) || data.version !== 1 ||
        !("records" in data) || !Array.isArray(data.records))
        throw new Error("The saved score file has an unsupported format.");
    const seen = new Set<string>();
    // Preserve scores saved before Signal Mixing was renamed.
    const records = data.records.map((record) => (record?.game === "camouflage" ? {...record, game: "signalMixing"} : record));
    for (const record of records) {
        const level = record != null && Object.hasOwn(games, record.game)
            ? games[record.game as GameId].levels.find(({id}) => id === record.level) : undefined;
        if (level == null || typeof record.modelId !== "string" ||
            !(models.some(({id}) => id === record.modelId) || /^local:[a-f0-9]{64}$/.test(record.modelId)) ||
            typeof record.modelName !== "string" || !record.modelName.trim() || record.modelName.length > 512 ||
            !Number.isInteger(record.latest) || !Number.isInteger(record.best) || record.latest < level.rounds.length ||
            record.best < record.latest || record.best > level.rounds.length * 1000 ||
            typeof record.completedAt !== "string" || !Number.isFinite(Date.parse(record.completedAt)))
            throw new Error("The saved score file contains an invalid score.");
        const key = `${record.modelId}/${record.game}/${record.level}`;
        if (seen.has(key))
            throw new Error("The saved score file contains duplicate scores.");
        seen.add(key);
    }
    return records;
}
