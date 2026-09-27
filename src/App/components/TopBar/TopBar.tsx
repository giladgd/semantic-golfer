import {flushSync} from "react-dom";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {modeState} from "../../../state/playState.ts";
import {GithubIconSVG} from "../../../icons/GithubIconSVG.tsx";
import {ExternalLinkIconSVG} from "../../../icons/ExternalLinkIconSVG.tsx";
import {ModelPicker} from "../ModelPicker/ModelPicker.tsx";
import "./TopBar.css";
import type {LlmState} from "../../../../shared/llmState.ts";

export function TopBar({state}: {state: LlmState}) {
    const mode = useExternalState(modeState);
    function switchMode(next: typeof mode) {
        if (next === modeState.state)
            return;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            modeState.state = next;
            return;
        }
        document.startViewTransition({
            types: [`to-${next}`],
            update: () => {
                flushSync(() => {
                    modeState.state = next;
                });
                // The mode transition replaces the page's usual entrance animation.
                for (const animation of document.querySelector(".mainContent > .page")?.getAnimations() ?? [])
                    animation.finish();
            }
        });
    }

    return <header className="topBar" data-platform={window.platform} data-mode={mode}>
        <div className="appIdentity">
            <img className="appMark" src="./icon.svg" alt="" draggable={false} />
            <strong>Semantic Golfer</strong>
        </div>
        <nav aria-label="Main navigation">
            <button
                aria-current={mode === "play" ? "page" : undefined}
                onClick={() => switchMode("play")}
            >Play
            </button>
            <button
                aria-current={mode === "playground" ? "page" : undefined}
                onClick={() => switchMode("playground")}
            >Playground
            </button>
        </nav>
        <div className="headerActions">
            <a
                className="repositoryLink"
                href="https://github.com/withcatai/node-llama-cpp?utm_source=semantic_golfer"
                target="_blank"
                rel="noreferrer"
                title="node-llama-cpp on GitHub"
                aria-label="node-llama-cpp on GitHub"
                draggable={false}
            ><GithubIconSVG aria-hidden="true" /><code>node-llama-cpp</code><ExternalLinkIconSVG className="externalLinkIcon" />
            </a>
            <ModelPicker state={state} />
        </div>
    </header>;
}
