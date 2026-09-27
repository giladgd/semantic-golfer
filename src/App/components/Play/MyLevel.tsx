import {games, type GameId} from "../../../../shared/games.ts";
import {models} from "../../../../shared/models.ts";
import {gameTotal, getScore} from "../../../../shared/scores.ts";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {ArrowBackIconSVG} from "../../../icons/ArrowBackIconSVG.tsx";
import {llmState} from "../../../state/llmState.ts";
import {playState} from "../../../state/playState.ts";
import "./MyLevel.css";

export function MyLevel() {
    const {scores, scoreError, loadedModelId, localModels} = useExternalState(llmState);
    const files = new Map(scores.filter(({modelId}) => modelId.startsWith("local:"))
        .map(({modelId, modelName}) => [modelId, modelName]));
    for (const {id, name} of localModels)
        files.set(id, name);
    const columns = [...models.map((model) => ({
        id: model.id, name: `${model.name} ${model.parameters}`, detail: model.quant
    })), ...Array.from(files, ([id, name]) => ({id, name, detail: "Local file"}))];
    return <section className="myLevel">
        <button
            className="backButton"
            onClick={() => {
                playState.state = {...playState.state, screen: "games"};
            }}
        >
            <ArrowBackIconSVG aria-hidden="true" />Games
        </button>
        <h1>My scores</h1>
        <p>Best scores for each model. Shorter successful answers earn more points.</p>
        <div className="scoreContent">
            {scoreError != null && <p className="scoreError" role="alert">{scoreError}</p>}
            {(Object.keys(games) as GameId[]).map((game) => <div className="scoreTable" key={game}>
                <table>
                    <caption>{games[game].name}</caption>
                    <thead><tr><th scope="col">Level</th>{columns.map((model) => <th scope="col" key={model.id} data-loaded={model.id === loadedModelId}>
                        {model.name}<small>{model.detail}</small>
                    </th>)}
                    </tr>
                    </thead>
                    <tbody>{games[game].levels.map((level) => <tr key={level.id}>
                        <th scope="row"><span>{level.id}</span>{level.title}</th>
                        {columns.map((model) => {
                            const record = getScore(scores, model.id, game, level.id);
                            return <td key={model.id} data-loaded={model.id === loadedModelId}>{record == null ?
                                <span className="notPlayed" aria-label="Not played">—</span> :
                                <strong>{record.best.toLocaleString()}</strong>}
                            </td>;
                        })}
                    </tr>)}
                    </tbody>
                    <tfoot><tr><th scope="row">Total</th>{columns.map((model) =>
                        <td key={model.id} data-loaded={model.id === loadedModelId}>
                            {gameTotal(scores, model.id, game).toLocaleString()}
                        </td>)}
                    </tr>
                    </tfoot>
                </table>
            </div>)}
        </div>
    </section>;
}
