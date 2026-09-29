import {useLayoutEffect, useRef} from "react";
import {getDemoFrame} from "../demo/playback.ts";
import {getCursorPosition, getCursorTarget} from "../demo/cursorTarget.ts";
import "./DemoCursor.css";

export function DemoCursor({frame, playing}: {
    frame: ReturnType<typeof getDemoFrame>, playing: boolean
}) {
    const pointer = useRef<HTMLDivElement>(null);
    const mirror = useRef<HTMLDivElement>(null);
    const text = useRef<HTMLSpanElement>(null);
    const hovered = useRef<HTMLElement | null>(null);
    const positions = useRef(new Map<string, {x: number, y: number}>([["entry", {x: 960, y: 420}]]));
    const destination = useRef<{from: string, to: string, scale: number, point: {x: number, y: number}} | null>(null);

    useLayoutEffect(() => {
        const animation = requestAnimationFrame(() => {
            const root = pointer.current!.closest<HTMLDivElement>(".demoViewport")!;
            const bounds = root.getBoundingClientRect();
            const scale = bounds.width / root.offsetWidth;
            const measure = (selector: string) => {
                const element = root.querySelector(selector);
                if (element == null)
                    return undefined;
                const rect = element.getBoundingClientRect();
                const left = (rect.left - bounds.left) / scale;
                const top = (rect.top - bounds.top) / scale;
                const aimY = element.clientHeight * (selector === ".decisionResult" ? 0.75 : 0.5);
                return {
                    bounds: {left, top, right: left + rect.width / scale, bottom: top + rect.height / scale},
                    aim: {x: left + element.clientWidth / 2,
                        y: top + (element instanceof HTMLTextAreaElement ? Math.min(45, aimY) : aimY)}
                };
            };
            const from = positions.current.get(frame.cursor.from) ?? measure(frame.cursor.from)?.aim ?? positions.current.get("entry")!;
            const targetBounds = measure(frame.cursor.to);
            // Keep the aim steady when the hovered control animates, such as a game card lifting up.
            if (targetBounds != null && (destination.current?.from !== frame.cursor.from ||
                destination.current.to !== frame.cursor.to || destination.current.scale !== scale)) {
                destination.current = {from: frame.cursor.from, to: frame.cursor.to, scale, point: getCursorTarget(
                    {x: from.x + frame.cursor.startOffset.x, y: from.y + frame.cursor.startOffset.y},
                    targetBounds.bounds, targetBounds.aim, frame.cursor.targetInset
                )};
            }
            const to = destination.current?.to === frame.cursor.to
                ? destination.current.point : positions.current.get(frame.cursor.to) ?? from;
            positions.current.set(frame.cursor.from, from);
            positions.current.set(frame.cursor.to, to);
            const {x, y} = getCursorPosition(from, to, frame.cursor.progress, frame.cursor.curve);
            const cursorX = x + frame.cursor.offset.x;
            const cursorY = y + frame.cursor.offset.y;
            pointer.current!.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

            // The preview is inert, so native hit testing skips it. Check controls at the cursor's actual position.
            const clientX = bounds.left + cursorX * scale;
            const clientY = bounds.top + cursorY * scale;
            const target = frame.cursor.visible ? [...root.querySelectorAll<HTMLElement>("button, a, input, textarea")].findLast((element) => {
                const rect = element.getBoundingClientRect();
                if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom ||
                    !element.checkVisibility())
                    return false;
                // Controls outside a scroll container's visible area must not receive hover feedback.
                for (let parent = element.parentElement; parent != null; parent = parent.parentElement) {
                    const style = getComputedStyle(parent);
                    const clip = parent.getBoundingClientRect();
                    if ((style.overflowX !== "visible" && (clientX < clip.left || clientX >= clip.right)) ||
                        (style.overflowY !== "visible" && (clientY < clip.top || clientY >= clip.bottom)))
                        return false;
                    if (parent === root)
                        break;
                }
                return true;
            }) ?? null : null;
            if (hovered.current !== target) {
                if (hovered.current != null)
                    delete hovered.current.dataset.demoHover;
                hovered.current = target;
                if (hovered.current != null)
                    hovered.current.dataset.demoHover = "true";
            }

            const input = root.querySelector<HTMLTextAreaElement>(frame.screen === "round" ? "#gameDocument" : "#documentText");
            mirror.current!.hidden = !frame.focused || input == null;
            if (input != null) {
                const rect = input.getBoundingClientRect();
                const style = getComputedStyle(input);
                Object.assign(mirror.current!.style, {
                    left: `${(rect.left - bounds.left) / scale}px`, top: `${(rect.top - bounds.top) / scale}px`,
                    width: `${input.clientWidth}px`, height: `${input.clientHeight}px`,
                    font: style.font, letterSpacing: style.letterSpacing, padding: style.padding, borderRadius: style.borderRadius
                });
                text.current!.textContent = frame.document;
                mirror.current!.scrollTop = input.scrollTop;
            }
        });
        return () => cancelAnimationFrame(animation);
    }, [frame]);

    return <div className="demoCursor" aria-hidden="true" data-playing={playing}>
        <div className="typingMirror" ref={mirror} data-selected={frame.selected} hidden><span ref={text} /><span className="caret" /></div>
        <div className="pointer" ref={pointer} data-visible={frame.cursor.visible}>
            <svg width="17" height="23" viewBox="0 0 17 23">
                <path d="M1 1v16l4.3-3.6 3.6 7.8 3.1-1.5-3.5-7.5h6Z" fill="#000" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
            </svg>
        </div>
    </div>;
}
