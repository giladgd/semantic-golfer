import {useEffect, useLayoutEffect, useRef} from "react";
import {seekScene} from "../demo/playback.ts";
import {scenes} from "../demo/scenes.ts";
import "./DemoSegment.css";

export function DemoSegment({index, active, progress}: {index: number, active: boolean, progress: number}) {
    const fill = useRef<HTMLSpanElement>(null);
    const latest = useRef(progress);
    const reset = useRef<Animation | null>(null);
    const scene = scenes[index]!;

    useLayoutEffect(() => {
        const element = fill.current!;
        if (progress < latest.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            reset.current?.cancel();
            const animation = element.animate([{opacity: 1}, {opacity: 0}], {duration: 180, fill: "forwards"});
            reset.current = animation;
            animation.onfinish = () => {
                element.style.width = `${latest.current * 100}%`;
                animation.cancel();
                reset.current = null;
            };
        }
        latest.current = progress;
        if (reset.current == null)
            element.style.width = `${progress * 100}%`;
    }, [progress]);
    useEffect(() => () => reset.current?.cancel(), []);

    return <button
        className="demoSegment gameDemoPlayback"
        aria-current={active ? "step" : undefined}
        aria-label={`Play ${scene.title} demo: ${scene.description}`}
        onClick={() => seekScene(index)}
    ><span className="segmentFill" ref={fill} aria-hidden="true" /><strong>{scene.title}</strong><span>{scene.description}</span>
    </button>;
}
