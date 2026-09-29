import {games, type GameId} from "../../../../shared/games.ts";
import {getLatestScore, getScore} from "../../../../shared/scores.ts";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {ArrowBackIconSVG} from "../../../icons/ArrowBackIconSVG.tsx";
import {BarsIconSVG} from "../../../icons/BarsIconSVG.tsx";
import {ClockIconSVG} from "../../../icons/ClockIconSVG.tsx";
import {RoundsIconSVG} from "../../../icons/RoundsIconSVG.tsx";
import {gameHelpState, hasSeenGameHelp} from "../../../state/gameHelpState.ts";
import {llmState} from "../../../state/llmState.ts";
import {getDraft, openLevel, playState} from "../../../state/playState.ts";
import "./LevelPicker.css";
import type {ModelId} from "../../../../shared/models.ts";

export function LevelPicker({game, modelId}: {game: GameId, modelId?: ModelId}) {
    const scores = useExternalState(llmState, (state) => state.scores);
    const drafts = useExternalState(playState, (state) => state.drafts);
    return <section className="levelPicker">
        <button
            className="backButton"
            onClick={() => {
                playState.state = {...playState.state, screen: "games"};
            }}
        >
            <ArrowBackIconSVG aria-hidden="true" />Games
        </button>
        <h1>{games[game].name}</h1>
        <div className="levels">{games[game].levels.map((level) => {
            const score = (modelId == null ? undefined : getScore(scores, modelId, game, level.id)) ??
                getLatestScore(scores, game, level.id);
            const draft = modelId == null ? undefined : getDraft(drafts, modelId, game, level.id);
            const started = draft != null && (draft.answers.length > 0 || draft.document.length > 0);
            return <button
                className="level"
                key={level.id}
                disabled={modelId == null}
                onClick={() => {
                    openLevel(game, level.id);
                    if (!hasSeenGameHelp(game))
                        gameHelpState.state = game;
                }}
            >
                <span className="levelDetails">
                    <span className="levelNumber">{level.id}</span>
                    <strong>{level.title}</strong>
                    <span className="levelDescription">{level.skill}</span>
                    <span className="levelMeta">
                        <span className="levelTag"><RoundsIconSVG aria-hidden="true" />{level.rounds.length} rounds</span>
                        <span className="levelTag">
                            <BarsIconSVG aria-hidden="true" />{Math.max(...level.rounds.map((round) => round.labels.length))} bars
                        </span>
                        <span className="levelTag estimatedDuration" title="Estimated time to finish this level">
                            <ClockIconSVG aria-hidden="true" />{level.estimatedDuration}
                        </span>
                    </span>
                </span>
                <span className="levelScore" data-played={score != null}>
                    {score == null ?
                        <span className="playAction">{started ? "Continue" : "Play"}<ArrowBackIconSVG aria-hidden="true" /></span> :
                        score.modelId === modelId ? <><strong>{score.latest.toLocaleString()}</strong><span>Last score</span></> : <>
                            <span>Played with</span><strong className="modelName" title={score.modelName}>{score.modelName}</strong>
                        </>}
                </span>
            </button>;
        })}
        </div>
    </section>;
}
