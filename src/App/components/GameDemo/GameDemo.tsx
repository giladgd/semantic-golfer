import {useEffect} from "react";
import {LongTimeout, State} from "lifecycle-utils";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {demoStepDuration, gameDemos, getGameDemoFrame} from "../../../state/gameDemos.ts";
import {games, isRoundWon, type GameId} from "../../../../shared/games.ts";
import {CheckIconSVG} from "../../../icons/CheckIconSVG.tsx";
import {GameMeterList} from "../GameMeterList/GameMeterList.tsx";
import "./GameDemo.css";

const playbackState = new State({elapsed: 0, playing: false});

export function GameDemo({game, active}: {game: GameId, active: boolean}) {
    const playback = useExternalState(playbackState);
    const demo = gameDemos[game];
    const duration = demo.steps.length * demoStepDuration;
    const frame = getGameDemoFrame(game, playback.elapsed);
    const round = {...games[game].levels[0]!.rounds[0]!, limit: demo.limit};
    const won = isRoundWon(game, round, frame.document, frame.probabilities);

    useEffect(() => {
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const pause = () => {
            if (motion.matches)
                playbackState.state = {elapsed: duration, playing: false};
        };
        if (active)
            playbackState.state = {elapsed: motion.matches ? duration : 0, playing: !motion.matches};
        else
            playbackState.state = {...playbackState.state, playing: false};
        motion.addEventListener("change", pause);
        return () => motion.removeEventListener("change", pause);
    }, [active, duration]);

    useEffect(() => {
        if (!active || !playback.playing)
            return;
        const start = performance.now();
        const timer = new LongTimeout(() => {
            const elapsed = Math.min(duration, playback.elapsed + performance.now() - start);
            playbackState.state = {elapsed, playing: elapsed < duration};
        }, 65);
        return () => timer.dispose();
    }, [active, duration, playback]);

    return <figure className="gameDemo" aria-label="Example round">
        <div className="demoScene">
            <div className="demoDocument">
                <span className="demoLabel">Your sentence</span>
                <div className="demoSentence">{frame.document}<span className="caret" data-playing={playback.playing} aria-hidden="true" /></div>
                <div className="demoFooter">
                    <span className="demoSuccess" data-won={won}><CheckIconSVG />{game === "lock" ? "Unlocked" : "Blended"}</span>
                    <span>{frame.document.length} / {demo.limit} characters</span>
                </div>
            </div>
            <div className="demoMeters"><GameMeterList game={game} labels={round.labels} probabilities={frame.probabilities} /></div>
        </div>
        <figcaption>{frame.caption}</figcaption>
    </figure>;
}

export function GameDemoPlayback({game}: {game: GameId}) {
    const playback = useExternalState(playbackState);
    const duration = gameDemos[game].steps.length * demoStepDuration;
    const progress = playback.elapsed / duration * 100;

    return <button
        className="gameDemoPlayback"
        style={{backgroundSize: `${progress}% 100%`}}
        aria-description={`Demo progress: ${Math.round(progress)}%`}
        onClick={() => {
            playbackState.state = {elapsed: playback.elapsed >= duration ? 0 : playback.elapsed, playing: !playback.playing};
        }}
    >{playback.playing ? "Pause demo" : playback.elapsed >= duration ? "Replay demo" : "Play demo"}
    </button>;
}
