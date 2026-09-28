import {lazy, Suspense, useSyncExternalStore} from "react";
import playgroundPreview from "../../assets/playground-preview.png";
import "./AppPreview.css";

const PlaygroundDemo = lazy(async () => {
    const {PlaygroundDemo} = await import("./PlaygroundDemo.tsx");
    return {default: PlaygroundDemo};
});
const subscribe = () => () => {};

export function AppPreview() {
    // The server and hydration render the same poster; the browser then loads the interactive app.
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const poster = <figure className="appPreview" id="demo">
        <img
            src={playgroundPreview}
            width="4096"
            height="2048"
            alt="Semantic Golfer Playground showing a document, yes/no criteria, and the model's decision probability."
        />
    </figure>;
    return <Suspense fallback={poster}>{mounted ? <PlaygroundDemo /> : poster}</Suspense>;
}
