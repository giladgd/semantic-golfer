import {Fragment} from "react";
import {signalMixingTarget, lockTarget, type GameId} from "../../../../shared/games.ts";
import {ProgressBar} from "../ProgressBar/ProgressBar.tsx";
import {MeterHelp} from "../MeterHelp/MeterHelp.tsx";
import "./GameMeterList.css";

export function GameMeterList({game, goalCount, labels, probabilities, descriptions}: {
    game: GameId, goalCount: number, labels: string[], probabilities: number[], descriptions: Array<string | undefined>
}) {
    // Separate content and spacing tracks so CSS can shrink the gaps without squeezing labels or bars.
    const rows = labels.map((_, index) => {
        const spacing = index === 0 ? "var(--game-meter-first-heading-rows)"
            : game === "signalMixing" && index === goalCount
                ? "var(--game-meter-divider-row) var(--game-meter-heading-rows)"
                : "var(--game-meter-spacing-row)";
        return `${spacing} var(--game-meter-rows)`;
    }).join(" ");

    return <div className="gameMeterList" data-game={game} style={{gridTemplateRows: rows}}>
        {labels.map((label, index) => {
            const value = probabilities[index];
            const description = descriptions[index];
            const minimum = game === "lock" ? lockTarget : index < goalCount ? signalMixingTarget.min : undefined;
            const maximum = game === "signalMixing" && index >= goalCount ? signalMixingTarget.other : undefined;
            const target = value != null && (minimum == null || value >= minimum) && (maximum == null || value < maximum);
            const startsRisks = game === "signalMixing" && index === goalCount;
            return <Fragment key={label}>
                {index === 0 || startsRisks
                    ? <h2 className="meterSectionHeading" data-start-risks={startsRisks}><span>{startsRisks ? "Risks" : "Goals"}</span></h2>
                    : <div className="meterGap" aria-hidden="true" />}
                <div className="gameMeter" data-target={target}>
                    <div className="meterHeading">
                        <span className="meterLabel">
                            {game === "lock" && <span className="lockNumber">{index + 1}</span>}
                            <span className="labelText">{label}{description != null && <MeterHelp label={label} description={description} />}</span>
                        </span>
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
                </div>
            </Fragment>;
        })}
    </div>;
}
