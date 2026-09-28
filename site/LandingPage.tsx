import {GithubIconSVG} from "../src/icons/GithubIconSVG.tsx";
import {GolfIconSVG} from "../src/icons/GolfIconSVG.tsx";
import {BlendIconSVG} from "../src/icons/BlendIconSVG.tsx";
import AppIcon from "../public/icon.svg?react";
import llamaIcon from "./assets/node-llama-cpp.svg";
import {AppPreview} from "./components/AppPreview.tsx";
import {InstallCommand} from "./components/InstallCommand.tsx";

export function LandingPage() {
    return <div className="landingPage">
        <header className="siteHeader">
            <a className="brand" href="#"><AppIcon aria-hidden="true" /><strong>Semantic Golfer</strong></a>
            <nav aria-label="Website navigation">
                <a className="githubLink" href="https://github.com/giladgd/semantic-golfer" aria-label="Semantic Golfer on GitHub"><GithubIconSVG /></a>
            </nav>
        </header>
        <main>
            <section className="hero" aria-labelledby="heroTitle">
                <h1 id="heroTitle"><span>Make every</span>{" "}<em>character count</em></h1>
                <p>Find the shortest way to say it. Play with meaning,<br className="desktopBreak" /> or watch AI decisions take shape as you type.</p>
                <InstallCommand />
            </section>
            <section className="demoSection" aria-label="See Semantic Golfer in action">
                <AppPreview />
            </section>
            <section className="features" aria-label="Explore the app">
                <article><span className="featureIcon"><GolfIconSVG /></span><h2>Less text. More skill</h2>
                    <p>Two word games. Eleven levels each. Match the meaning, beat the character limit, and improve your best score.</p>
                </article>
                <article><span className="featureIcon"><BlendIconSVG /></span><h2>Your words, your rules</h2>
                    <p>Ask a yes-or-no question, choose between options, or score a document. Change the criteria and see what happens.</p>
                </article>
                <article><span className="featureIcon"><img src={llamaIcon} alt="" /></span><h2>All on your machine</h2>
                    <p><a href="https://node-llama-cpp.withcat.ai/guide/structured-decisions">Powered by node-llama-cpp’s structured decisions API</a>.
                        {" "}Pick a model in the app and start exploring. Your text stays on your device. No API key, no subscription.
                    </p>
                </article>
            </section>
        </main>
        <footer className="siteFooter">
            <span>Built to play with <a href="https://node-llama-cpp.withcat.ai/guide/structured-decisions"><code>node-llama-cpp</code> structured decisions</a></span>
            <a href="https://github.com/giladgd/semantic-golfer">Open source · MIT</a>
            <a className="plainTextGuide" href="./llms.txt" tabIndex={-1}>Plain-text guide</a>
        </footer>
    </div>;
}
