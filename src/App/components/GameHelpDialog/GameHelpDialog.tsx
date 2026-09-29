import {useEffect, useId, useRef} from "react";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {dismissGameHelp, gameHelpState} from "../../../state/gameHelpState.ts";
import {signalMixingTarget, games, lockTarget, type GameId} from "../../../../shared/games.ts";
import {GameDemo, GameDemoPlayback} from "../GameDemo/GameDemo.tsx";
import "./GameHelpDialog.css";

export function GameHelpDialog({game, ready}: {game: GameId, ready: boolean}) {
    const activeGame = useExternalState(gameHelpState);
    const dialog = useRef<HTMLDialogElement>(null);
    const startButton = useRef<HTMLButtonElement>(null);
    const headingId = useId();
    const descriptionId = useId();
    const open = activeGame === game && ready;

    useEffect(() => {
        if (open) {
            dialog.current?.showModal();
            startButton.current?.focus();
        } else
            dialog.current?.close();
    }, [open]);

    return <dialog
        className="gameHelpDialog"
        ref={dialog}
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onClose={() => {
            if (ready && gameHelpState.state === game)
                dismissGameHelp(game);
        }}
    >
        <h2 id={headingId}>{games[game].name}</h2>
        <p id={descriptionId}>{game === "lock"
            ? <>Read the brief and write a message that meets every goal.
                Get every bar to {lockTarget * 100}% or more while staying within the character limit.
            </>
            : <>Read the brief and write a message that achieves every goal.
                Get each goal to {signalMixingTarget.min * 100}% or more
                and keep each risk below {signalMixingTarget.other * 100}%.
                Revise your wording to balance clarity, tact, and the character limit.
            </>}
        </p>
        <p>Shorter answers earn more points. Finish every round to save your level score for this model.</p>
        <GameDemo game={game} active={open} />
        <div className="dialogActions">
            <GameDemoPlayback game={game} />
            <button className="startButton" ref={startButton} onClick={() => dialog.current?.close()}>Start playing</button>
        </div>
    </dialog>;
}
