import {useSyncExternalStore} from "react";
import playgroundPreview from "../../assets/playground-preview.png";
import {PlaygroundDemo} from "./PlaygroundDemo.tsx";
import "./AppPreview.css";

const subscribe = () => () => {};

export function AppPreview() {
    // Match the server poster during hydration, then mount the already-loaded demo.
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const poster = <figure className="appPreview" id="demo">
        <img
            src={playgroundPreview}
            width="4096"
            height="2048"
            alt="Semantic Golfer Playground showing a document, yes/no criteria, and the model's decision probability."
        />
    </figure>;
    return mounted ? <PlaygroundDemo /> : poster;
}
