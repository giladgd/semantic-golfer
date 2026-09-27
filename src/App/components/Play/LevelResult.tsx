import {characterCount, games, levelScore, roundScore, type GameId, type GameLevel} from "../../../../shared/games.ts";
import {getScore} from "../../../../shared/scores.ts";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {llmState} from "../../../state/llmState.ts";
import {openLevel, playState, saveGameScore, updateGame, type GameDraft} from "../../../state/playState.ts";
import {RoundsIconSVG} from "../../../icons/RoundsIconSVG.tsx";
import {ReplayIconSVG} from "../../../icons/ReplayIconSVG.tsx";
import {TrophyIconSVG} from "../../../icons/TrophyIconSVG.tsx";
import {CelebrationIconSVG} from "../../../icons/CelebrationIconSVG.tsx";
import {ArrowBackIconSVG} from "../../../icons/ArrowBackIconSVG.tsx";
import {AdvanceButton} from "./AdvanceButton.tsx";
import "./LevelResult.css";
import type {ModelId} from "../../../../shared/models.ts";

export function LevelResult({game, level, modelId, draft}: {game: GameId, level: GameLevel, modelId: ModelId, draft: GameDraft}) {
    const scores = useExternalState(llmState, (state) => state.scores);
    const score = levelScore(level, draft.answers.map(characterCount));
    const best = draft.completion?.record.best ?? getScore(scores, modelId, game, level.id)?.best;
    const next = games[game].levels.find(({id}) => id === level.id + 1);
    return <section className="levelResult">
        <span className="levelName">{games[game].name} · Level {level.id}</span>
        <h1>{level.title}</h1>
        <div className="scoreSummary" aria-live="polite">
            <div className="yourScore"><span>Your score</span><strong>{score.toLocaleString()}</strong></div>
            <div className="bestScore"><span>Best score</span><strong>{best?.toLocaleString() ?? "—"}</strong></div>
        </div>
        {draft.completion != null && draft.completion.record.latest > draft.completion.previousBest &&
            <p className="newBest"><CelebrationIconSVG aria-hidden="true" />New record for this model!</p>}
        <div className="roundScores">{level.rounds.map((round, index) => <div className="roundScore" key={round.id}>
            <span>{index + 1}. {round.title}<small>{characterCount(draft.answers[index]!)} / {round.limit} characters</small></span>
            <strong>{roundScore(round, characterCount(draft.answers[index]!)).toLocaleString()}</strong>
        </div>)}
        </div>
        {draft.saving && <p role="status">Saving score…</p>}
        {draft.error != null && <p className="saveError" role="alert">{draft.error}
            <button onClick={() => void saveGameScore(modelId, game, level.id)}>Retry saving</button>
        </p>}
        <div className="resultActions">
            <div className="secondaryActions">
                <button onClick={() => {
                    playState.state = {...playState.state, screen: "levels"};
                }}
                ><RoundsIconSVG aria-hidden="true" />Levels
                </button>
                <button
                    disabled={draft.saving || draft.completion == null}
                    onClick={() => updateGame(modelId, game, level.id,
                        {answers: [], document: "", startedAt: undefined, completion: undefined, error: undefined})}
                ><ReplayIconSVG aria-hidden="true" />Play again
                </button>
                <button
                    autoFocus={next == null}
                    onClick={() => {
                        playState.state = {...playState.state, screen: "scores"};
                    }}
                ><TrophyIconSVG aria-hidden="true" />My scores
                </button>
            </div>
            {next != null && <AdvanceButton className="nextLevel" autoFocus onClick={() => openLevel(game, next.id)}>
                Next level<ArrowBackIconSVG aria-hidden="true" />
            </AdvanceButton>}
        </div>
    </section>;
}
