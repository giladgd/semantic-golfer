import {useExternalState} from "../../../hooks/useExternalState.ts";
import {getDraft, playState} from "../../../state/playState.ts";
import {games, type GameId} from "../../../../shared/games.ts";
import {llmState} from "../../../state/llmState.ts";
import {ArrowBackIconSVG} from "../../../icons/ArrowBackIconSVG.tsx";
import {RoundsIconSVG} from "../../../icons/RoundsIconSVG.tsx";
import {ClockIconSVG} from "../../../icons/ClockIconSVG.tsx";
import {GolfIconSVG} from "../../../icons/GolfIconSVG.tsx";
import {BlendIconSVG} from "../../../icons/BlendIconSVG.tsx";
import {TrophyIconSVG} from "../../../icons/TrophyIconSVG.tsx";
import {LevelPicker} from "./LevelPicker.tsx";
import {LevelResult} from "./LevelResult.tsx";
import {MyLevel} from "./MyLevel.tsx";
import {PlayRound} from "./PlayRound.tsx";
import "./Play.css";

export function Play() {
    const play = useExternalState(playState);
    const modelId = useExternalState(llmState, (state) => state.loadedModelId);
    const appVersion = useExternalState(llmState, (state) => state.appVersion);
    if (play.screen === "scores")
        return <MyLevel />;
    if (play.screen === "levels")
        return <LevelPicker game={play.game} modelId={modelId} />;
    if (play.screen === "round" && modelId != null) {
        const level = games[play.game].levels.find(({id}) => id === play.level)!;
        const draft = getDraft(play.drafts, modelId, play.game, play.level);
        return draft.answers.length === level.rounds.length
            ? <LevelResult game={play.game} level={level} modelId={modelId} draft={draft} />
            : <PlayRound key={draft.answers.length} game={play.game} level={level} modelId={modelId} draft={draft} />;
    }
    return <section className="play" aria-label="Games">
        <div className="intro"><h1>Play with meaning</h1>
            <button onClick={() => {
                playState.state = {...playState.state, screen: "scores"};
            }}
            ><TrophyIconSVG aria-hidden="true" />My scores
            </button>
        </div>
        <div className="gameChoices">{(Object.keys(games) as GameId[]).map((id) => <button
            className="gameChoice"
            key={id}
            disabled={id === "signalMixing"}
            onClick={() => {
                playState.state = {...playState.state, screen: "levels", game: id};
            }}
        >
            <span className="gameSymbol" aria-hidden="true">{id === "lock" ? <GolfIconSVG /> : <BlendIconSVG />}</span>
            <span className="gameName">{games[id].name}</span>
            <span className="description">{games[id].description}</span>
            <span className="gameMeta">
                {id === "signalMixing" ? <span className="gameTag">Coming soon</span> : <>
                    <span className="gameTag"><RoundsIconSVG aria-hidden="true" />{games[id].levels.length} levels</span>
                    <span className="gameTag"><ClockIconSVG aria-hidden="true" />5–10 min / level</span>
                    <span className="playGame">Play game <ArrowBackIconSVG aria-hidden="true" /></span>
                </>}
            </span>
        </button>)}
        </div>
        {appVersion != null && <span className="appVersion">v{appVersion}</span>}
    </section>;
}
