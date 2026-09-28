import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {App} from "../../src/App/App.tsx";
import {useExternalState} from "../../src/hooks/useExternalState.ts";
import {decisionState} from "../../src/state/decisionState.ts";
import {getDraft, modeState, playState, updateGame} from "../../src/state/playState.ts";
import {models} from "../../shared/models.ts";
import {advancePlayback, getDemoFrame, playbackState, timeline, togglePlayback} from "../demo/playback.ts";
import {getSceneRequest, scenes} from "../demo/scenes.ts";
import "../../src/App/components/GameDemo/GameDemo.css";
import {DemoCursor} from "./DemoCursor.tsx";
import {DemoSegment} from "./DemoSegment.tsx";
import {PlaybackToggle} from "./PlaybackToggle.tsx";
import "./PlaygroundDemo.css";

const previewWidth = 1280;
decisionState.state = {...decisionState.state, type: "noul", drafts: {...decisionState.state.drafts, noul: getSceneRequest(scenes[0]!, "").input}};
modeState.state = "playground";

export function PlaygroundDemo() {
    const frame = useRef<HTMLDivElement>(null);
    const playback = useExternalState(playbackState);
    const [visible, setVisible] = useState(false);
    const [pageVisible, setPageVisible] = useState(!document.hidden);
    const [entered, setEntered] = useState(false);
    const duration = timeline[playback.scene]!.duration;
    const finished = playback.elapsed >= duration;
    const demo = getDemoFrame(playback.scene, playback.elapsed, playback.firstPlay);

    useEffect(() => {
        let disposed = false;
        const animations = frame.current!.closest(".demoSection")?.getAnimations() ?? [];
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
            if (!disposed)
                setEntered(true);
        });
        return () => {
            disposed = true;
        };
    }, []);

    useLayoutEffect(() => {
        const element = frame.current!;
        const landing = element.closest(".landingPage");
        const introAnimation = landing?.querySelector(".hero h1 > span")?.getAnimations()[0];
        const demoAnimation = element.closest(".demoSection")?.getAnimations()[0];
        if (introAnimation?.startTime != null && demoAnimation) {
            // Consume the delay already spent loading, keeping the later sections staggered if the demo is late.
            const now = Number(document.timeline.currentTime);
            const elapsed = Math.min(now - Number(introAnimation.startTime), demoAnimation.effect!.getTiming().delay ?? 0);
            for (const section of landing!.querySelectorAll(".demoSection, .features, .siteFooter")) {
                for (const animation of section.getAnimations())
                    animation.startTime = now - elapsed;
            }
        }
        element.style.setProperty("--preview-scale", String(element.getBoundingClientRect().width / previewWidth));
        const resize = new ResizeObserver(([entry]) => {
            element.style.setProperty("--preview-scale", String(entry!.contentRect.width / previewWidth));
        });
        const observer = new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting), {threshold: 0.15});
        const visibility = () => setPageVisible(!document.hidden);
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const reduceMotion = () => {
            if (motion.matches)
                playbackState.state = {...playbackState.state, scene: 0, elapsed: timeline[0]!.duration, playing: false};
        };
        reduceMotion();
        resize.observe(element);
        observer.observe(element);
        document.addEventListener("visibilitychange", visibility);
        motion.addEventListener("change", reduceMotion);
        return () => {
            resize.disconnect();
            observer.disconnect();
            document.removeEventListener("visibilitychange", visibility);
            motion.removeEventListener("change", reduceMotion);
        };
    }, []);

    useEffect(() => {
        if (!playback.playing || !visible || !pageVisible || !entered)
            return;
        const start = performance.now();
        const animation = requestAnimationFrame(() => advancePlayback(performance.now() - start));
        return () => cancelAnimationFrame(animation);
    }, [playback, visible, pageVisible, entered]);

    useEffect(() => {
        const scene = scenes[playback.scene]!;
        if ("game" in scene) {
            const screen = demo.screen as "games" | "levels" | "round";
            if (playState.state.screen !== screen)
                playState.state = {...playState.state, screen, game: "lock", level: 1};
            const draft = getDraft(playState.state.drafts, models[0].id, "lock", 1);
            if (draft.document !== demo.document || draft.answers.length > 0)
                updateGame(models[0].id, "lock", 1, {document: demo.document, answers: [], startedAt: performance.now() - playback.elapsed});
            modeState.state = "play";
        } else {
            const input = {...scene.input, document: demo.document};
            const editor = decisionState.state;
            if (editor.type !== input.type || editor.drafts[input.type].document !== input.document ||
                editor.drafts[input.type].instruction !== input.instruction)
                decisionState.state = {...editor, type: input.type, drafts: {...editor.drafts, [input.type]: input}};
            modeState.state = "playground";
        }
    }, [playback.scene, playback.elapsed, demo.document, demo.screen]);

    return <figure className="playgroundDemo" id="demo" aria-label="Semantic Golfer demo">
        <div className="demoFrame" ref={frame}>
            <div className="demoViewport" inert aria-hidden="true" data-focused={demo.focused}>
                <div className="windowLights"><i /><i /><i /></div>
                <App />
                <DemoCursor frame={demo} playing={playback.playing && visible && pageVisible} />
            </div>
        </div>
        <div className="demoControls" aria-label="Demo playback">
            <PlaybackToggle playing={playback.playing} finished={finished} onToggle={togglePlayback} />
            <div className="demoSegments" role="group" aria-label="Demo segments">
                {scenes.map((scene, index) => <DemoSegment
                    key={scene.title}
                    index={index}
                    active={playback.scene === index}
                    progress={index < playback.scene ? 1 : index > playback.scene ? 0 : playback.elapsed / duration}
                />)}
            </div>
        </div>
    </figure>;
}
