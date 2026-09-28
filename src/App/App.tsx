import {useExternalState} from "../hooks/useExternalState.ts";
import {llmState} from "../state/llmState.ts";
import {modeState, playState} from "../state/playState.ts";
import {TopBar} from "./components/TopBar/TopBar.tsx";
import {Playground} from "./components/Playground/Playground.tsx";
import {Play} from "./components/Play/Play.tsx";
import {UpdateToast} from "./components/UpdateToast/UpdateToast.tsx";
import "./App.css";

export function App() {
    const llm = useExternalState(llmState);
    const mode = useExternalState(modeState);
    const playScreen = useExternalState(playState, ({screen, game, level}) => `${screen}/${game}/${level}`);
    return <div className="app">
        <TopBar state={llm} />
        <main className="mainContent" data-mode={mode} data-blocked={llm.loadedModelId == null} inert={llm.loadedModelId == null}>
            <div className="page" key={mode === "play" ? playScreen : mode}>{mode === "play" ? <Play /> : <Playground />}</div>
        </main>
        <UpdateToast update={llm.update} />
    </div>;
}
