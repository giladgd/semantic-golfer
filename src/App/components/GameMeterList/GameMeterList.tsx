import {signalMixingTarget, lockTarget, type GameId} from "../../../../shared/games.ts";
import {ProgressBar} from "../ProgressBar/ProgressBar.tsx";
import "./GameMeterList.css";

export function GameMeterList({game, labels, probabilities}: {game: GameId, labels: string[], probabilities: number[]}) {
    return <div className="gameMeterList" data-game={game}>
        {labels.map((label, index) => {
            const value = probabilities[index];
            const minimum = game === "lock" ? lockTarget : index < 2 ? signalMixingTarget.min : undefined;
            const maximum = game === "signalMixing" && index >= 2 ? signalMixingTarget.other : undefined;
            const target = value != null && (minimum == null || value >= minimum) && (maximum == null || value < maximum);
            return <div className="gameMeter" key={label} data-target={target}>
                <div className="meterHeading"><span>{game === "lock" && <span className="lockNumber">{index + 1}</span>}{label}</span>
                    <strong>{value == null ? "—" : `${(value * 100).toFixed(1)}%`}</strong>
                </div>
                <div className="meterBar">
                    <ProgressBar value={value ?? 0} label={label} />
                    {minimum != null && <span
                        className="threshold"
                        data-bound="minimum"
                        style={{left: `${minimum * 100}%`}}
                        aria-hidden="true"
                    />}
                    {maximum != null && <span
                        className="threshold"
                        data-bound="maximum"
                        style={{left: `${maximum * 100}%`}}
                        aria-hidden="true"
                    />}
                </div>
            </div>;
        })}
    </div>;
}
