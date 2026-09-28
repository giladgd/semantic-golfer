import {renderToString} from "react-dom/server";
import {LandingPage} from "./LandingPage.tsx";

export function render() {
    return renderToString(<LandingPage />);
}
