import {useEffect, useState} from "react";
import {State} from "lifecycle-utils";
import {getRoundFeedback} from "../../../../shared/feedback.ts";
import {gameProbabilities, type GameId, type GameLevel, type GameRound} from "../../../../shared/games.ts";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import "./RoundFeedback.css";
import type {EvaluationState} from "../../../state/DecisionRunner.ts";

export function RoundFeedback({won, game, level, round, document, result, startedAt}: {
    won: boolean, game: GameId, level: GameLevel, round: GameRound, document: string,
    result: EvaluationState["result"], startedAt?: number
}) {
    const [message] = useState(() => new State("", {queueEvents: false}));
    const text = useExternalState(message);
    // State is an observable store with a mutable setter; the hook subscribes to that setter.
    /* eslint-disable react-hooks/immutability */
    useEffect(() => {
        if (won) {
            message.state = getRoundFeedback(game, level, round, document, gameProbabilities(result),
                startedAt == null ? Infinity : performance.now() - startedAt) ?? "";
        }
    }, [won, game, level, round, document, result, startedAt, message]);
    /* eslint-enable react-hooks/immutability */

    // Retain the last message during the fade, without announcing an outdated win.
    return <span className="roundFeedback" role="status" aria-hidden={!won} data-visible={won && text !== ""}>{text}</span>;
}
