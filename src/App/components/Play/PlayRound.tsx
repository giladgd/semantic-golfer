import {flushSync} from "react-dom";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {finishRound, playState, updateGame, type GameDraft} from "../../../state/playState.ts";
import {signalMixingTarget, characterCount, gameProbabilities, gameRequest, games, isRoundWon, lockTarget,
    type GameId, type GameLevel} from "../../../../shared/games.ts";
import {decisionRunner} from "../../../state/decisionState.ts";
import {gameHelpState} from "../../../state/gameHelpState.ts";
import {ArrowBackIconSVG} from "../../../icons/ArrowBackIconSVG.tsx";
import {GameMeterList} from "../GameMeterList/GameMeterList.tsx";
import {GameHelpDialog} from "../GameHelpDialog/GameHelpDialog.tsx";
import {RoundFeedback} from "./RoundFeedback.tsx";
import {AdvanceButton} from "./AdvanceButton.tsx";
import "./PlayRound.css";
import type {ModelId} from "../../../../shared/models.ts";

export function PlayRound({game, level, modelId, draft}: {game: GameId, level: GameLevel, modelId: ModelId, draft: GameDraft}) {
    const evaluation = useExternalState(decisionRunner.state);
    const round = level.rounds[draft.answers.length]!;
    const back = () => {
        playState.state = {...playState.state, screen: "levels"};
    };
    const request = gameRequest(modelId, round, draft.document);
    const result = evaluation.result;
    // A previous round's answer must never open the current round's lock.
    const sameRound = result != null && result.request.modelId === modelId &&
        JSON.stringify([result.request.input, ...result.request.additionalInputs ?? []]
            .map(({document, ...question}) => question)) ===
        JSON.stringify(round.questions);
    const probabilities = gameProbabilities(game, sameRound ? result : undefined);
    const current = result != null && JSON.stringify(result.request) === JSON.stringify(request);
    const won = current && evaluation.error == null && isRoundWon(game, round, draft.document, probabilities);
    const count = characterCount(draft.document);

    return <section className="playRound" aria-label={games[game].name}>
        <div className="spacer" />
        <div className="gameHeading">
            <button className="backButton" onClick={back}>
                <ArrowBackIconSVG aria-hidden="true" />
                Levels
            </button>
            <span>{games[game].name}</span>
        </div>
        <div className="roundHeader">
            <div className="roundIntro"><h1>{round.title}</h1><p>{game === "lock"
                ? `Get every condition to ${lockTarget * 100}% or more.`
                : <>Bring {round.labels[0]} and {round.labels[1]} to {signalMixingTarget.min * 100}% or more each.
                    Keep every other category below {signalMixingTarget.other * 100}%.
                </>}
            </p>
            </div>
            <div className="roundCount">Level {level.id} · Round {draft.answers.length + 1} / {level.rounds.length}</div>
        </div>
        <div className="gameBoard">
            <div className="writingArea">
                <label className="writingHeading" htmlFor="gameDocument">Your message</label>
                <textarea
                    id="gameDocument"
                    data-gramm="false"
                    data-enable-grammarly="false"
                    data-enable-grazie="false"
                    data-lt-active="false"
                    value={draft.document}
                    autoFocus
                    placeholder="Make every character count…"
                    aria-describedby="characterLimit"
                    spellCheck={false}
                    disabled={modelId == null}
                    onChange={(event) => updateGame(modelId, game, level.id, {startedAt: draft.startedAt ?? performance.now(),
                        document: Array.from(event.target.value).slice(0, round.limit)
                            .join("")})}
                />
                <div className="writingFooter">
                    <span id="characterLimit" className="characterBudget" data-full={count >= round.limit}>
                        {count} / {round.limit} characters
                    </span>
                </div>
            </div>
            <div className="gameMeters" aria-label="Live results" aria-busy={evaluation.running}>
                <GameMeterList game={game} labels={round.labels} probabilities={probabilities} />
                <div className="gameTiming" aria-label="Decision time">
                    <strong>{sameRound ? <>{result.duration.toLocaleString(undefined, {maximumFractionDigits: 1})}<span> ms</span></> : "—"}</strong>
                </div>
                {evaluation.error != null && <div className="gameError" role="alert">{evaluation.error}
                    <button onClick={() => void decisionRunner.retry()} disabled={evaluation.running}>Retry</button>
                </div>}
            </div>
        </div>
        <div className="roundFooter">
            <button
                className="howToPlay"
                onClick={() => {
                    gameHelpState.state = game;
                }}
            >How to play
            </button>
            <RoundFeedback
                won={won}
                game={game}
                level={level}
                round={round}
                document={draft.document}
                result={result}
                startedAt={draft.startedAt}
            />
            <AdvanceButton
                className="nextButton"
                disabled={!won}
                onClick={() => {
                    document.startViewTransition({
                        types: [draft.answers.length === level.rounds.length - 1 ? "level-result" : "next-round"],
                        update: () => flushSync(() => finishRound(modelId, game, level.id, decisionRunner.state.state))
                    });
                }}
            >
                {draft.answers.length === level.rounds.length - 1 ? "Finish level" : "Next round"}<span aria-hidden="true"> →</span>
            </AdvanceButton>
        </div>
        <div className="spacer" />
        <GameHelpDialog game={game} ready={modelId != null} />
    </section>;
}
