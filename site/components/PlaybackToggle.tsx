import PlayPauseIcon from "../assets/play-pause.svg?react";
import "./PlaybackToggle.css";

export function PlaybackToggle({playing, finished, onToggle}: {playing: boolean, finished: boolean, onToggle: () => void}) {
    const label = playing ? "Pause" : finished ? "Replay" : "Play";

    return <button className="playbackToggle" aria-label={label} onClick={onToggle}>
        <span className="playbackIcon" aria-hidden="true">
            {label === "Replay" ? <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8" />
            </svg> : <PlayPauseIcon className="playPauseIcon" data-playing={playing} />}
        </span>
        <span className="playbackLabel" aria-hidden="true">
            {["Play", "Pause", "Replay"].map((text) => <span key={text} data-active={text === label}>{text}</span>)}
        </span>
    </button>;
}
