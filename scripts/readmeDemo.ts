import {playbackState, timeline} from "../site/demo/playback.ts";

type ElementFrame = {
    tag: string,
    attributes: Array<[string, string]>,
    style: Record<string, string>,
    position: string,
    clip: string,
    children: Array<ElementFrame | string>
};
type Sample<T = ElementFrame | string> = {at: number, value: T};

// Runs only in the export browser. The resulting SVG contains CSS animations, never JavaScript.
export async function recordReadmeDemo() {
    const viewport = document.querySelector<HTMLElement>(".demoViewport")!;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync([...document.styleSheets].flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
        .filter((rule) => !rule.startsWith("@font-face"))
        .join("\n"));
    // Keep the recorded layout when the image is embedded at a different size.
    const freezeLayout = (rules: CSSRuleList) => {
        for (const rule of rules) {
            if (rule instanceof CSSMediaRule && /width|height/.test(rule.conditionText))
                rule.media.mediaText = matchMedia(rule.conditionText).matches ? "all" : "not all";
            if ("cssRules" in rule)
                freezeLayout((rule as CSSGroupingRule).cssRules);
        }
    };
    freezeLayout(sheet.cssRules);
    const positions: string[] = [];
    const recordSelector = (selector: string) => {
        if (!positions.includes(selector))
            positions.push(selector);
        return `[data-p~="p${positions.indexOf(selector)}"]`;
    };
    let styles = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    // Hidden scene variants still match :has(). Record its original matches, including nested selector functions.
    for (let start = styles.indexOf(":has("); start !== -1; start = styles.indexOf(":has(", start)) {
        let end = styles.indexOf(")", start);
        while (end !== -1 && !CSS.supports(`selector(${styles.slice(start, end + 1)})`))
            end = styles.indexOf(")", end + 1);
        if (end === -1)
            throw new Error("Could not record a :has() selector in the demo styles");
        styles = styles.slice(0, start) + recordSelector(styles.slice(start, end + 1)) + styles.slice(end + 1);
    }
    styles = styles
        .replace(/\btextarea\b/g, ":is(textarea,.exportTextarea)")
        // Hidden scene variants must not change first/last/nth-child matching either.
        .replace(/:(?:(?:first|last|only)-(?:child|of-type)|nth-(?:child|of-type)\([^)]*\))/g, recordSelector);
    await Promise.all([...viewport.querySelectorAll("img")].map(async (image) => {
        const blob = await (await fetch(image.src)).blob();
        image.src = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(blob);
        });
        await image.decode();
    }));
    const offsets = timeline.map((_, index) => timeline.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0));
    const duration = timeline.reduce((sum, scene) => sum + scene.duration, 0);
    console.info(`[readme-demo] Recording one full loop (${Math.ceil(duration / 1000)} seconds)…`);
    const frames: Sample<ElementFrame>[] = [];
    let previous = -Infinity;
    let lastScene = 0;
    playbackState.state = {scene: 0, elapsed: 0, playing: false, firstPlay: false};
    // Let React apply the reset and the cursor's deferred layout run before capturing frame zero.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("Timed out recording the README demo")), duration * 3);
        const started = performance.now();
        let nextProgress = 10_000;
        const capture = () => {
            const {scene, elapsed} = playbackState.state;
            const next = performance.now() - started;
            if (next >= duration) {
                window.clearTimeout(timeout);
                resolve();
                return;
            }
            if (next >= nextProgress) {
                console.info(`[readme-demo] ${Math.floor(next / duration * 100)}% recorded · ` +
                    `${Math.ceil((duration - next) / 1000)} seconds remaining`);
                nextProgress += 10_000;
            }
            const at = offsets[scene]! + elapsed;
            if (at - previous >= 40 || scene !== lastScene) {
                frames.push({at: frames.length === 0 ? 0 : at, value: snapshot(viewport, positions)});
                previous = at;
            }
            lastScene = scene;
            const nextScene = offsets.findLastIndex((offset) => offset <= next);
            playbackState.state = {scene: nextScene, elapsed: next - offsets[nextScene]!, playing: false, firstPlay: false};
            requestAnimationFrame(capture);
        };
        requestAnimationFrame(capture);
    });
    console.info("[readme-demo] Recording complete. Building and minifying the SVG…");
    return {frames, duration, styles};
}

function snapshot(element: Element, positions: string[]): ElementFrame {
    const textarea = element instanceof HTMLTextAreaElement;
    const style = getComputedStyle(element);
    const inline = (element as HTMLElement | SVGElement).style;
    const attributes = [...element.attributes].filter(({name}) =>
        (!name.startsWith("aria-") || ["aria-current", "aria-pressed", "aria-invalid"].includes(name)) &&
        !["style", "title", "tabindex", "autofocus", "inert", "href"].includes(name) &&
        !(textarea && name === "class"))
        .map(({name, value}): [string, string] => [name, value]);
    if (element.localName === "svg" && !element.hasAttribute("xmlns"))
        attributes.push(["xmlns", "http://www.w3.org/2000/svg"]);
    const matching = positions.flatMap((selector, index) => (element.matches(selector) ? [`p${index}`] : []));
    if (matching.length > 0)
        attributes.push(["data-p", matching.join(" ")]);
    const properties = Object.fromEntries([...inline].map((property) => [property, inline.getPropertyValue(property)]));
    // Capture interpolation from the real CSS transitions, not just the destination values.
    properties.transform = style.transform;
    properties.opacity = style.opacity;
    if (inline.left)
        properties.left = style.left;
    if (element.classList.contains("caret")) {
        // Bake the caret position too: WebKit can delay reflow after animated CSS content changes.
        const bounds = element.getBoundingClientRect();
        const parent = element.parentElement!.getBoundingClientRect();
        properties.position = "absolute";
        properties.inset = `${bounds.top - parent.top}px auto auto ${bounds.left - parent.left}px`;
    }
    if (textarea) {
        attributes.push(["class", `${element.className} exportTextarea`], ["data-placeholder", String(element.value === "")]);
        properties["white-space"] = "pre-wrap";
        properties["overflow-wrap"] = "break-word";
    }
    return {
        tag: textarea ? "div" : element.localName,
        attributes,
        style: properties,
        position: style.position,
        clip: style.clipPath,
        children: textarea ? [element.value || element.placeholder] : [...element.childNodes].flatMap<ElementFrame | string>((child) =>
            (child instanceof Element ? [snapshot(child, positions)] : child.nodeType === Node.TEXT_NODE ? [child.textContent ?? ""] : []))
    };
}

export function compileReadmeDemo(frames: Sample[], duration: number, styles: string, font: string) {
    const rules: string[] = [];
    const keyframes = new Map<string, string>();
    const declarations = new Map<string, string>();
    const icons = new Map<string, string>();
    let nextId = 0;
    const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    const quote = (text: string) => `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
        .replace(/\n/g, "\\a ")
        .replace(/\r/g, "")}"`;
    const percent = (at: number) => `${Number((at / duration * 100).toFixed(5))}%`;
    const animate = (values: Sample<string>[], property: string, smooth = false) => {
        const changes = values.filter((sample, index) => index === 0 || sample.value !== values[index - 1]!.value ||
            (smooth && sample.value !== values[index + 1]?.value));
        if (values.every(({value}) => value === values[0]!.value))
            return undefined;
        const keys = changes.map(({at, value}) => `${percent(at)}{${property}:${value}}`);
        keys.push(`100%{${property}:${changes.at(-1)!.value}}`);
        const body = keys.join("");
        let name = keyframes.get(body);
        if (name == null) {
            name = `a${nextId++}`;
            keyframes.set(body, name);
            rules.push(`@keyframes ${name}{${body}}`);
        }
        return `${name} ${duration}ms ${smooth ? "linear" : "steps(1,end)"} infinite both`;
    };
    const render = (samples: Sample[], end: number): string => {
        if (samples.every(({value}) => typeof value === "string")) {
            const values = samples as Sample<string>[];
            const animation = animate(values.map(({at, value}) => ({at, value: quote(value)})), "content");
            if (animation == null)
                return escape(values[0]!.value);
            const name = `t${nextId++}`;
            rules.push(`.${name}::after{content:${quote(values[0]!.value)};animation:${animation}}`);
            return `<export-text class="${name}"/>`;
        }
        const runs: Array<{samples: Sample<ElementFrame>[], signature: string}> = [];
        for (const sample of samples as Sample<ElementFrame>[]) {
            const {tag, attributes, children} = sample.value;
            const signature = JSON.stringify([tag, attributes, children.map((child) => typeof child)]);
            if (runs.at(-1)?.signature === signature)
                runs.at(-1)!.samples.push(sample);
            else
                runs.push({samples: [sample], signature});
        }
        return runs.map((run, index) => {
            const first = run.samples[0]!;
            const until = runs[index + 1]?.samples[0]!.at ?? end;
            const node = first.value;
            const animations: string[] = [];
            const properties = {...node.style};
            if (runs.length > 1) {
                // Keep descendants' clocks running; display animations are also unsupported by Firefox.
                for (const [property, hidden, visible] of [["position", "absolute", node.position],
                    ["clip-path", "inset(100%)", node.clip]] as const) {
                    const visibility = [{at: 0, value: hidden}, {at: first.at, value: visible}, {at: until, value: hidden}];
                    if (first.at === 0)
                        visibility.shift();
                    const animation = animate(visibility, property);
                    if (animation != null)
                        animations.push(animation);
                }
            }
            for (const property of new Set(run.samples.flatMap(({value}) => Object.keys(value.style)))) {
                const values = run.samples.map(({at, value}) => ({at, value: value.style[property] || "initial"}));
                const animation = animate(values, property, ["transform", "left", "opacity"].includes(property));
                if (animation != null) {
                    delete properties[property];
                    animations.push(animation);
                }
            }
            if (animations.length > 0)
                properties.animation = `${animations.join(",")} !important`;
            properties.transition = "none";
            const inline = Object.entries(properties).map(([property, value]) => `${property}:${value}`)
                .join(";");
            let styleClass = declarations.get(inline);
            if (styleClass == null) {
                styleClass = `s${nextId++}`;
                declarations.set(inline, styleClass);
                // Keep the captured declarations above the app's class selectors in the cascade.
                rules.push(`#export .${styleClass}{${inline}}`);
            }
            const classes = [node.attributes.find(([name]) => name === "class")?.[1], styleClass].filter(Boolean).join(" ");
            const attributes = node.attributes.filter(([name]) => name !== "class")
                .map(([name, value]) => ` ${name}="${escape(value)}"`)
                .join("");
            let children = node.children.map((_, child) => render(run.samples.map(({at, value}) =>
                ({at, value: value.children[child]!})), until)).join("");
            if (node.tag === "svg") {
                let icon = icons.get(children);
                if (icon == null) {
                    icon = `i${nextId++}`;
                    icons.set(children, icon);
                }
                children = `<use href="#${icon}"/>`;
            }
            return `<${node.tag}${attributes} class="${escape(classes)}">${children}</${node.tag}>`;
        }).join("");
    };
    const movie = render(frames, duration);
    const poster = render([frames.findLast(({at}) => at < timeline[0]!.duration - 1000)!], duration);
    return `<svg xmlns="http://www.w3.org/2000/svg" id="export" width="1280" height="720" viewBox="0 0 1280 720"
role="img" aria-labelledby="title description" data-duration="${duration}">
<title id="title">Semantic Golfer - live structured decisions</title>
<desc id="description">A looping recording of the real app: yes/no decisions, choosing a category, scoring an issue, and Semantic Golfing.
Open the website for playback controls and the interactive demo.</desc>
<style><![CDATA[
${styles}
#export{background:transparent;width:100%;height:auto}
/* WebKit drops the SVG scale for positioned HTML. Cancel it here and scale the HTML itself. */
#export>foreignObject{overflow:visible;transform-origin:0 0;transform:scale(calc(1280px / 100vw))}
#export>foreignObject>.playgroundDemo{width:1280px;height:720px;transform-origin:0 0;transform:scale(calc(100vw / 1280px))}
#export>foreignObject>.playgroundDemo::after{content:"";position:absolute;inset:0;z-index:10;pointer-events:none;
box-shadow:inset 0 0 0 1px var(--border-color);border-radius:20px}
@font-face{font-family:"Inter Variable";font-style:normal;font-weight:100 900;src:url("data:font/woff2;base64,${font}") format("woff2")}
.exportTextarea[data-placeholder="true"]{color:var(--muted-text-color)}
.playgroundDemo>.demoFrame{background:var(--background-color);box-shadow:none;border-radius:20px}
.exportPoster{display:none}
${rules.join("\n")}
@media(prefers-reduced-motion:reduce){.exportMovie{display:none}.exportPoster{display:block}.exportPoster *{animation:none!important}}
]]></style>
<defs>${[...icons].map(([children, id]) => `<g id="${id}">${children}</g>`).join("")}</defs>
<foreignObject width="1280" height="720"><div xmlns="http://www.w3.org/1999/xhtml" class="playgroundDemo">
<div class="demoFrame exportMovie">${movie}</div><div class="demoFrame exportPoster">${poster}</div></div></foreignObject>
</svg>\n`;
}
