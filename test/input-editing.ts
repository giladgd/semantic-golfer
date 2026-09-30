// Run after `npx vite build`: `npx electron test/input-editing.ts` (use xvfb-run on headless Linux).
// Set TEST_PLATFORM=darwin or win32 to check the platform-specific shortcut in the renderer.
import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {setTimeout} from "node:timers/promises";
import {fileURLToPath} from "node:url";
import {app, BrowserWindow, ipcMain} from "electron";
import {createBirpc} from "birpc";
import {initialLlmState, type LlmState} from "../shared/llmState.ts";
import {models, type ModelId} from "../shared/models.ts";
import {addLevelScore, type LevelScoreInput} from "../shared/scores.ts";
import {games} from "../shared/games.ts";
import {getGameMeterDescriptions} from "../shared/gameDescriptions.ts";
import type {DecisionRequest, DecisionResult} from "../shared/decision.ts";

const profile = await mkdtemp(path.join(tmpdir(), "decision-input-test-"));
const testPlatform = process.env.TEST_PLATFORM ?? process.platform;
app.setPath("userData", profile);
app.on("window-all-closed", () => {});
void app.whenReady().then(async () => {
    let preload = fileURLToPath(new URL("../dist-electron/preload.mjs", import.meta.url));
    if (process.env.TEST_PLATFORM != null) {
        const source = await readFile(preload, "utf8");
        assert.ok(source.includes("process.platform"));
        preload = path.join(profile, "preload.cjs");
        await writeFile(preload, source.replace("process.platform", JSON.stringify(testPlatform)));
    }
    const window = new BrowserWindow({
        show: true, width: 1380, height: 900,
        webPreferences: {preload, partition: "input-editing-test"}
    });
    const contents = window.webContents;
    const evaluations: DecisionRequest[] = [];
    let selectedFile: ModelId | undefined;
    let loadCount = 0;
    let updateClicks = 0;
    let state: LlmState = {...initialLlmState,
        models: Object.fromEntries(models.map(({id}) => [id, {downloaded: true}]))};
    const rpc = createBirpc<{updateState: (state: LlmState) => void}>({
        getState: () => state,
        installUpdate() {
            updateClicks++;
            state = {...state, update: {status: "downloading", version: "1.2.3", progress: 0.42}};
            void rpc.updateState(state);
        },
        dismissUpdate() {
            state = {...state, update: {...state.update!, dismissed: true}};
            void rpc.updateState(state);
        },
        selectModelFile: () => selectedFile,
        loadModel(modelId: ModelId) {
            loadCount++;
            state = {...state, loadedModelId: modelId};
            void rpc.updateState(state);
        },
        async saveLevelScore(input: LevelScoreInput) {
            await setTimeout(100);
            const saved = addLevelScore(state.scores, input, input.modelId);
            state = {...state, scores: state.scores.filter((score) => score.modelId !== input.modelId ||
                score.game !== input.game || score.level !== input.level).concat(saved.record)};
            void rpc.updateState(state);
            return saved;
        },
        async evaluateDecision(request: DecisionRequest): Promise<DecisionResult> {
            // Return older results while edits continue, without requiring a downloaded model.
            await setTimeout(80);
            evaluations.push(request);
            const inputs = [request.input, ...request.additionalInputs ?? []];
            const round = Object.values(games).flatMap(({levels}) => levels.flatMap(({rounds}) => rounds))
                .find(({questions}) => questions.length === inputs.length &&
                    questions.every((question, index) => question.type === inputs[index]!.type &&
                        question.instruction === inputs[index]!.instruction &&
                        JSON.stringify(question.criteria) === JSON.stringify(inputs[index]!.criteria)));
            const answers = inputs.map((input, index): DecisionResult["answer"] => {
                if (input.type === "noul")
                    return {type: "noul", value: input.document.includes("invalid") || (round != null && index >= round.goalCount)
                        ? 0.1 : 0.8};
                const probabilities = round != null && input.type === "choice"
                    ? (index < round.goalCount ? [0.1, 0.9] : [0.9, 0.1])
                    : input.criteria.map(() => 1 / input.criteria.length);
                return input.type === "choice"
                    ? {type: "choice", choice: "0", confidence: 0.5,
                        probabilities: Object.fromEntries(probabilities.map((value, index) => [String(index), value]))}
                    : {type: "score", score: (input.criteria.length - 1) / 2, confidence: 0.5, probabilities};
            });
            return {answer: answers[0]!, additionalAnswers: answers.slice(1), duration: 80};
        }
    }, {
        post: (data) => contents.send("llmRpc", data),
        on: (listener) => ipcMain.on("llmRpc", (_, data) => listener(data)),
        serialize: JSON.stringify,
        deserialize: JSON.parse
    });

    const evaluate = <T, R>(callback: (argument: T) => R, argument?: T): Promise<R> =>
        contents.executeJavaScript(`(${callback})(${JSON.stringify(argument)})`);
    const waitFor = async (callback: () => boolean | undefined | Promise<boolean>) => {
        const deadline = Date.now() + 5000;
        while (!await callback()) {
            assert.ok(Date.now() < deadline, "Timed out waiting for the UI");
            await setTimeout(10);
        }
    };
    const click = (selector: string) => evaluate((selector) => document.querySelector<HTMLButtonElement>(selector)!.click(), selector);
    const pointerClick = async (selector: string) => {
        await waitFor(() => evaluate((selector) => {
            const button = document.querySelector(selector)!;
            const {x, y, width, height} = button.getBoundingClientRect();
            return button.contains(document.elementFromPoint(x + width / 2, y + height / 2));
        }, selector));
        const point = await evaluate((selector) => {
            const {x, y, width, height} = document.querySelector(selector)!.getBoundingClientRect();
            return {x: Math.round(x + width / 2), y: Math.round(y + height / 2)};
        }, selector);
        contents.sendInputEvent({type: "mouseMove", ...point});
        contents.sendInputEvent({type: "mouseDown", button: "left", clickCount: 1, ...point});
        contents.sendInputEvent({type: "mouseUp", button: "left", clickCount: 1, ...point});
    };
    const select = (selector: string, start: number, end = start) => evaluate(({selector, start, end}) => {
        const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
        input.focus();
        input.setSelectionRange(start, end);
    }, {selector, start, end});
    const read = (selector: string) => evaluate((selector) => {
        const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
        return {value: input.value, start: input.selectionStart, end: input.selectionEnd};
    }, selector);
    const insert = (text: string) => contents.debugger.sendCommand("Input.insertText", {text});
    const advance = async (modifiers = testPlatform === "darwin" ? 4 : 2, autoRepeat = false) => {
        await contents.debugger.sendCommand("Input.dispatchKeyEvent", {
            type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, modifiers, autoRepeat
        });
        await contents.debugger.sendCommand("Input.dispatchKeyEvent", {type: "keyUp", key: "Enter", code: "Enter", modifiers});
    };
    const checkEditing = async (selector: string) => {
        await select(selector, 0, 32_000);
        await insert("Hello world");
        await select(selector, 6);
        let expected = "Hello world";
        let caret = 6;
        for (const character of "new ") {
            await insert(character);
            expected = expected.slice(0, caret) + character + expected.slice(caret);
            caret += character.length;
            assert.deepEqual(await read(selector), {value: expected, start: caret, end: caret}, selector);
            await setTimeout(20);
        }
        await select(selector, 6, 9);
        await insert("beautiful");
        assert.deepEqual(await read(selector), {value: "Hello beautiful world", start: 15, end: 15}, selector);
        await contents.debugger.sendCommand("Input.dispatchKeyEvent", {
            type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8
        });
        await contents.debugger.sendCommand("Input.dispatchKeyEvent", {type: "keyUp", key: "Backspace", code: "Backspace"});
        assert.deepEqual(await read(selector), {value: "Hello beautifu world", start: 14, end: 14}, selector);
        await insert("l");
        await insert(" 🐈");
        expected = "Hello beautiful 🐈 world";
        assert.deepEqual(await read(selector), {value: expected, start: 18, end: 18}, selector);
        await select(selector, 6, 15);
        await setTimeout(250);
        assert.deepEqual(await read(selector), {value: expected, start: 6, end: 15}, `${selector} after evaluation`);
        console.log(`${selector}: insertion, replacement, deletion, Unicode, and selection during evaluation passed`);
    };

    const checkPlaygroundKeyboard = async (type: string) => {
        const press = async (key: string, modifiers = 0) => {
            const windowsVirtualKeyCode = {Enter: 13, Backspace: 8, ArrowUp: 38, ArrowDown: 40, Escape: 27}[key];
            await contents.debugger.sendCommand("Input.dispatchKeyEvent", {
                type: "keyDown", key, code: key, windowsVirtualKeyCode, modifiers, ...(key === "Enter" ? {text: "\r"} : {})
            });
            await contents.debugger.sendCommand("Input.dispatchKeyEvent", {type: "keyUp", key, code: key, modifiers});
        };
        const focus = () => evaluate(() => {
            const input = document.activeElement as HTMLTextAreaElement;
            return {id: input.id, start: input.selectionStart, end: input.selectionEnd};
        });
        const at = async (id: string, caret: number) => assert.deepEqual(await focus(), {id, start: caret, end: caret});
        const rows = () => evaluate(() => [...document.querySelectorAll<HTMLTextAreaElement>(".criterion textarea")]
            .map((input) => input.value));
        await click(".criteriaEditor .examples button:first-of-type");
        const original = await rows();
        assert.equal(await evaluate(() => document.querySelector(".addButton") != null), false);
        assert.deepEqual(await evaluate(() => [...document.querySelectorAll<HTMLTextAreaElement>(".criterion textarea")]
            .map((input) => input.placeholder)), type === "noul"
            ? ["Describe what counts as yes", "Describe what counts as no"]
            : original.map(() => (type === "choice" ? "Describe this choice" : "Describe this level")));
        for (const selector of ["#decisionQuestion", "#criterion-0", "#documentText"]) {
            for (const key of ["Enter", "Backspace", "ArrowUp", "ArrowDown", "Escape"]) {
                for (const guard of ["selection", "shiftKey", "metaKey", "ctrlKey", "altKey", "isComposing"]) {
                    await select(selector, key === "ArrowUp" ? 0 : 32_000);
                    if (guard === "selection")
                        await select(selector, 0, 1);
                    const before = await focus();
                    const prevented = await evaluate(({selector, key, guard}) => {
                        const event = new KeyboardEvent("keydown", {
                            key, bubbles: true, cancelable: true, ...(guard === "selection" ? {} : {[guard]: true})
                        });
                        document.querySelector(selector)!.dispatchEvent(event);
                        return event.defaultPrevented;
                    }, {selector, key, guard});
                    assert.equal(prevented, false, `${type} ${selector} ${key} ${guard}`);
                    assert.deepEqual(await focus(), before);
                    assert.deepEqual(await rows(), original);
                }
            }
        }
        await select("#criterion-0", 0);
        await press("ArrowUp");
        const instructionLength = (await read("#decisionQuestion")).value.length;
        await at("decisionQuestion", instructionLength);
        await press("Enter");
        await at("criterion-0", 0);
        await press("ArrowUp");
        await press("ArrowDown");
        await at("criterion-0", 0);
        await select("#criterion-0", 32_000);
        await press("ArrowDown");
        await at("criterion-1", 0);
        await press("ArrowUp");
        await at("criterion-0", original[0]!.length);
        await press("Escape");
        assert.equal((await focus()).id, "documentText");
        await press("Escape");
        assert.equal((await focus()).id, "decisionQuestion");
        await press("Escape");
        assert.equal((await focus()).id, "documentText");
        for (const selector of ["#decisionQuestion", "#criterion-0"]) {
            await select(selector, 1);
            await press("Enter");
            assert.equal((await read(selector)).value[1], "\n");
            assert.equal((await focus()).id, selector.slice(1));
            await select(selector, 32_000);
            await press("Enter", 8);
            assert.ok((await read(selector)).value.endsWith("\n"));
            assert.equal((await rows()).length, original.length);
        }
        await click(".criteriaEditor .examples button:first-of-type");
        if (type !== "noul") {
            await select("#criterion-0", 32_000);
            await press("Enter");
            assert.deepEqual(await rows(), [original[0], "", ...original.slice(1)]);
            await at("criterion-1", 0);
            await press("Backspace");
            assert.deepEqual(await rows(), original);
            await at("criterion-0", original[0]!.length);
            const last = original.length - 2;
            await waitFor(() => evaluate(() => document.querySelector(".decisionResult")?.getAttribute("aria-busy") === "false"));
            const evaluationCount = evaluations.length;
            await select(`#criterion-${last}`, 32_000);
            await press("ArrowDown");
            await at(`criterion-${last + 1}`, 0);
            await press("ArrowUp");
            await at(`criterion-${last}`, original[last]!.length);
            await press("Enter");
            await at(`criterion-${last + 1}`, 0);
            assert.deepEqual(await rows(), original);
            await press("Enter");
            await at(`criterion-${last + 2}`, 0);
            assert.deepEqual(await rows(), [...original, ""]);
            await press("Backspace");
            await at(`criterion-${last + 1}`, 0);
            await press("Backspace");
            await at(`criterion-${last}`, original[last]!.length);
            await setTimeout(100);
            assert.equal(evaluations.length, evaluationCount, "Navigating the placeholder must not evaluate it");
            await press("Enter");
            for (const character of "New option") {
                await insert(character);
                const value = (await read(`#criterion-${last + 1}`)).value;
                await at(`criterion-${last + 1}`, value.length);
                assert.equal((await rows()).length, original.length + 1);
                assert.equal((await rows()).at(-1), "");
            }
            await waitFor(() => evaluations.at(-1)?.input.criteria.at(-1) === "New option");
            assert.equal(evaluations.at(-1)!.input.criteria.length, original.length);
            await select(`#criterion-${last + 1}`, 0, 32_000);
            await press("Backspace");
            assert.deepEqual(await rows(), original);
            await at(`criterion-${last + 1}`, 0);
            assert.equal(await evaluate(() => document.querySelector(".criterion:last-of-type textarea")?.getAttribute("aria-invalid")),
                "false");
            assert.deepEqual(await evaluate(() => {
                const button = document.querySelector<HTMLButtonElement>(".criterion:last-of-type .removeButton")!;
                return [button.matches(":disabled"), getComputedStyle(button).visibility, button.offsetWidth, button.offsetHeight];
            }), [true, "hidden", 28, 28]);
            await press("Backspace");
            await select("#criterion-0", 0, 32_000);
            await press("Backspace");
            assert.equal((await rows()).length, original.length, "Deleting selected text must retain its row");
            await press("Backspace");
            assert.deepEqual(await rows(), original.slice(1));
            await at("criterion-0", 0);
            while ((await rows()).length > 3)
                await click(".criterion:nth-last-of-type(2) .removeButton");
            await select("#criterion-0", 0, 32_000);
            await press("Backspace");
            await press("Backspace");
            assert.equal((await rows()).length, 3);
            await click(".criteriaEditor .examples button:first-of-type");
            const limit = type === "choice" ? 50 : 10;
            while ((await rows()).at(-1) === "") {
                await select(`#criterion-${(await rows()).length - 1}`, 0);
                await insert(`Option ${(await rows()).length}`);
            }
            assert.equal((await rows()).length, limit);
            if (type === "choice")
                assert.deepEqual(await evaluate(() => [...document.querySelectorAll(".criterion > label")]
                    .filter((_, index) => [0, 25, 26, 49].includes(index)).map((label) => label.textContent)), ["A", "Z", "AA", "AX"]);
            await waitFor(() => evaluate((limit) => document.querySelectorAll(".probability").length === limit, limit));
            assert.ok(await evaluate(() => [".criteriaList", ".probabilities"].every((selector) => {
                const list = document.querySelector<HTMLElement>(selector)!;
                list.scrollTop = list.scrollHeight;
                return getComputedStyle(list).overflowY === "auto" && list.scrollTop > 0;
            })), "All options and probabilities must be reachable by scrolling");
            await select("#criterion-0", 32_000);
            await press("Enter");
            assert.equal((await rows()).length, limit);
            await click(".criterion:last-of-type .removeButton");
            assert.equal((await rows()).length, limit);
            assert.equal((await rows()).at(-1), "");
            await select("#criterion-0", 32_000);
            await press("Enter");
            await at("criterion-1", 0);
            await insert("Inserted at the limit");
            assert.equal((await rows()).length, limit);
        } else {
            await select("#criterion-0", 32_000);
            await press("Enter");
            assert.equal((await rows()).length, 2);
            await select("#criterion-0", 0, 32_000);
            await press("Backspace");
            await press("Backspace");
            assert.equal((await rows()).length, 2);
        }
        await click(".criteriaEditor .examples button:first-of-type");
        console.log(`${type}: criterion editing, caret navigation, Escape, selections, modifiers, composition, and limits passed`);
    };

    let exitCode = 0;
    try {
        await window.loadFile(fileURLToPath(new URL("../dist/index.html", import.meta.url)));
        contents.debugger.attach("1.3");
        const errors: unknown[] = [];
        contents.debugger.on("message", (_, method, parameters) => {
            if (method === "Runtime.exceptionThrown")
                errors.push(parameters.exceptionDetails);
        });
        await contents.debugger.sendCommand("Runtime.enable");
        await waitFor(() => evaluate(() => document.querySelector<HTMLDialogElement>(".requiredPicker")?.open));
        assert.equal(await evaluate(() => document.querySelector(".requiredPicker")!.matches(":modal")), false);
        assert.equal(await evaluate(() => {
            const header = document.querySelector(".topBar")!;
            const {x, y, width} = header.getBoundingClientRect();
            return document.elementFromPoint(x + width / 2, y + 2) === header &&
                getComputedStyle(header).getPropertyValue("app-region") === "drag";
        }), true, "The title bar's draggable area is exposed before a model loads");
        const openedLinks: string[] = [];
        contents.setWindowOpenHandler(({url}) => {
            openedLinks.push(url);
            return {action: "deny"};
        });
        for (const selector of [".appIdentity", ".repositoryLink"]) {
            const url = await evaluate((selector) => document.querySelector<HTMLAnchorElement>(selector)!.href, selector);
            await pointerClick(selector);
            await waitFor(() => openedLinks.at(-1) === url);
        }
        for (const [index, mode] of [[2, "playground"], [1, "play"]] as const) {
            const selector = `.topBar nav button:nth-child(${index})`;
            await pointerClick(selector);
            await waitFor(() => evaluate((mode) => document.querySelector<HTMLElement>(".mainContent")!.dataset.mode === mode, mode));
            await evaluate((selector) => document.querySelector<HTMLButtonElement>(selector)!.focus(), selector);
            assert.equal(await evaluate((selector) => document.activeElement?.matches(selector), selector), true);
            assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".mainContent")!.inert), true);
            assert.equal(await evaluate(() => document.querySelector<HTMLDialogElement>(".requiredPicker")!.open), true);
            await setTimeout(300);
        }
        contents.sendInputEvent({type: "keyDown", keyCode: "Escape"});
        contents.sendInputEvent({type: "keyUp", keyCode: "Escape"});
        assert.equal(await evaluate(() => document.querySelector<HTMLDialogElement>(".requiredPicker")!.open), true);
        console.log("Startup title bar: exposed drag region, real link/navigation clicks, keyboard focus, and required model gate passed");
        state = {...state, update: {status: "available", version: "1.2.3"}};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => document.querySelector(".updateToast")?.matches(":popover-open")));
        assert.equal(await evaluate(() => document.querySelector(".updateMessage strong")!.textContent), "1.2.3 is available");
        await pointerClick(".installUpdate");
        await waitFor(() => evaluate(() => document.querySelector(".installUpdate")?.textContent?.includes("42%")));
        assert.equal(updateClicks, 1);
        assert.equal(await evaluate(() => document.querySelector<HTMLButtonElement>(".installUpdate")!.disabled), true);
        assert.equal(await evaluate(() => document.querySelector<HTMLProgressElement>(".installUpdate progress")!.value), 0.42);
        state = {...state, update: {status: "error", version: "1.2.3", error: "Download interrupted"}};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => document.querySelector(".installUpdate")?.textContent === "Retry update"));
        await pointerClick(".dismissUpdate");
        await waitFor(() => evaluate(() => !document.querySelector(".updateToast")?.matches(":popover-open")));
        state = {...state, update: {status: "available", version: "1.2.3", manual: "Download this build"}};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => document.querySelector(".installUpdate")?.textContent === "Download update"));
        // Opening a confirmation must keep the toast interactive, then return it to the app.
        await pointerClick(".requiredPicker .deleteModel");
        await waitFor(() => evaluate(() => document.querySelector(".requiredPicker .deleteModelDialog")?.matches(":modal")));
        await pointerClick(".dismissUpdate");
        await waitFor(() => evaluate(() => !document.querySelector(".updateToast")?.matches(":popover-open")));
        state = {...state, update: {status: "available", version: "1.2.3"}};
        await rpc.updateState(state);
        await pointerClick(".requiredPicker .deleteModelDialog .dialogActions button:first-child");
        await waitFor(() => evaluate(() => !document.querySelector(".requiredPicker .deleteModelDialog")?.matches(":modal")));
        await evaluate(() => document.querySelector<HTMLButtonElement>(".dismissUpdate")!.focus());
        assert.equal(await evaluate(() => document.activeElement?.matches(".dismissUpdate")), true,
            "Toast controls remain keyboard-accessible alongside the required picker");
        assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".mainContent")!.inert), true);
        state = {...state, loadedModelId: "qwen-0.8b"};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => document.querySelector<HTMLElement>(".mainContent")?.inert === false));
        await pointerClick(".dismissUpdate");
        await waitFor(() => evaluate(() => !document.querySelector(".updateToast")?.matches(":popover-open")));
        contents.sendInputEvent({type: "keyDown", keyCode: "Tab"});
        contents.sendInputEvent({type: "keyUp", keyCode: "Tab"});
        const identity = await evaluate(() => {
            const link = document.querySelector<HTMLAnchorElement>(".appIdentity")!;
            link.focus();
            return {url: link.href, target: link.target, region: getComputedStyle(link).getPropertyValue("app-region")};
        });
        assert.deepEqual(identity, {url: "https://github.com/giladgd/semantic-golfer", target: "_blank", region: "no-drag"});
        await waitFor(() => evaluate(() => getComputedStyle(document.querySelector(".identityLinkIcon")!).opacity === "1"));
        await evaluate(() => (document.activeElement as HTMLElement)?.blur());
        state = {...state, update: undefined};
        await rpc.updateState(state);
        console.log("Update toast: real clicks during model selection, nested modals, keyboard access, progress, dismissal, and identity link passed");
        const pickerPosition = () => evaluate(() => {
            const rect = document.querySelector("#modelsPopover")!.getBoundingClientRect();
            return [rect.right, rect.top];
        });
        const checkPicker = async (centered: boolean) => {
            await waitFor(() => evaluate((centered) =>
                document.querySelector<HTMLDialogElement>(".requiredPicker")!.open === centered &&
                document.querySelector("#modelsPopover")!.matches(":popover-open") !== centered, centered));
            assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".modelButtonArea")!.hidden), centered);
            assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".mainContent")!.inert), true);
            assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".mainContent")!.dataset.blocked), "true");
        };
        await click(".modelButton");
        await setTimeout(250);
        const anchoredPosition = await pickerPosition();
        for (const stage of ["model", "context", "warmup"] as const) {
            state = {...state, loadedModelId: undefined, loading: {modelId: "qwen-2b", progress: 0.5, stage}};
            await rpc.updateState(state);
            await checkPicker(false);
            assert.ok((await pickerPosition()).every((value, index) => Math.abs(value - anchoredPosition[index]!) < 1));
            assert.equal(await evaluate(() => document.querySelector(".modelButtonName")!.textContent), "Qwen 3.5 2B");
        }
        state = {...state, loadedModelId: "qwen-2b", loading: undefined};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => !document.querySelector<HTMLElement>(".mainContent")!.inert));
        assert.equal(await evaluate(() => document.querySelector<HTMLDialogElement>(".requiredPicker")!.open), false);
        // A native confirmation dialog can dismiss the popover before the next load starts.
        await evaluate(() => document.querySelector<HTMLElement>("#modelsPopover")!.hidePopover());
        state = {...state, loadedModelId: undefined, loading: {modelId: "qwen-0.8b", progress: 0, stage: "model"}};
        await rpc.updateState(state);
        await checkPicker(false);
        state = {...state, loading: undefined, error: "Test model could not load"};
        await rpc.updateState(state);
        await checkPicker(true);
        assert.equal(await evaluate(() => document.querySelector(".requiredPicker .error")!.textContent), state.error);
        // Retrying from the centered picker stays centered until loading succeeds.
        state = {...state, error: undefined, loading: {modelId: "qwen-0.8b", progress: 0.5, stage: "warmup"}};
        await rpc.updateState(state);
        await checkPicker(true);
        state = {...state, loadedModelId: "qwen-0.8b", loading: undefined};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => !document.querySelector<HTMLDialogElement>(".requiredPicker")!.open));
        assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".mainContent")!.inert), false);
        console.log("Model picker: anchored loading/warmup, dimmed content, failed-load fallback, and centered retry passed");
        await evaluate(() => {
            const start = document.startViewTransition.bind(document);
            document.startViewTransition = (options) => {
                const transition = start(options);
                void transition.ready.then(() => {
                    const animations = document.getAnimations().filter((animation) => animation instanceof CSSAnimation);
                    if (document.documentElement.matches(":active-view-transition-type(next-round, level-result)")) {
                        document.documentElement.dataset.roundMotion = JSON.stringify(animations
                            .filter(({animationName}) => ["appModeEnter", "appModeLeave", "roundEnter", "roundLeave"].includes(animationName))
                            .map((animation) => {
                                const effect = animation.effect as KeyframeEffect;
                                const frames = effect.getKeyframes();
                                const frame = animation.animationName.endsWith("Enter") ? frames[0]! : frames.at(-1)!;
                                const transform = new DOMMatrix(String(frame.transform));
                                return [animation.animationName, effect.getTiming().duration, frames[0]!.easing,
                                    transform.m41, Number(transform.a.toFixed(3))];
                            })
                            .sort());
                    }
                    const enter = animations.find((animation) => animation.animationName === "appModeEnter");
                    const leave = animations.find((animation) => animation.animationName === "appModeLeave");
                    if (enter == null || leave == null)
                        return;
                    const first = (enter.effect as KeyframeEffect).getKeyframes()[0]!;
                    const last = (leave.effect as KeyframeEffect).getKeyframes().at(-1)!;
                    document.documentElement.dataset.modeMotion = JSON.stringify([
                        new DOMMatrix(String(first.transform)).m41, new DOMMatrix(String(last.transform)).m41
                    ]);
                }, () => {});
                return transition;
            };
        });
        await click(".topBar nav button:nth-child(2)");
        await waitFor(() => evaluate(() => document.querySelector(".typeSwitch") != null));
        await waitFor(() => evaluate(() => document.documentElement.dataset.modeMotion === "[24,-24]"));
        for (const type of ["noul", "choice", "score"]) {
            await evaluate((type) => [...document.querySelectorAll<HTMLButtonElement>(".typeSwitch button")]
                .find((button) => button.textContent === type)!.click(), type);
            for (const selector of ["#documentText", "#decisionQuestion", "#criterion-0", "#criterion-1"])
                await checkEditing(selector);
            await waitFor(() => evaluations.at(-1)?.input.type === type &&
                evaluations.at(-1)?.input.criteria[1] === "Hello beautiful 🐈 world");
            await checkPlaygroundKeyboard(type);
        }
        await evaluate(() => {
            for (const game of ["lock", "signalMixing"])
                localStorage.setItem(`game-help:${game}`, "seen");
        });
        await click(".topBar nav button:first-child");
        await waitFor(() => evaluate(() => document.querySelector(".gameChoice") != null));
        await waitFor(() => evaluate(() => document.documentElement.dataset.modeMotion === "[-24,24]"));
        assert.deepEqual(await evaluate(() => [...document.querySelectorAll(".gameChoice .gameTag")]
            .map((tag) => tag.textContent?.trim())), Object.values(games).map((game) => `${game.levels.length} levels`));
        for (const index of [1, 2]) {
            await click(`.gameChoice:nth-child(${index})`);
            await waitFor(() => evaluate(() => document.querySelector(".levelPicker .level") != null));
            assert.deepEqual(await evaluate(() => [...document.querySelectorAll(".levelPicker .estimatedDuration")]
                .map((tag) => tag.textContent?.trim())),
            games[index === 1 ? "lock" : "signalMixing"].levels.map((level) => level.estimatedDuration));
            await click(".levelPicker .level:first-child");
            await waitFor(() => evaluate(() => document.querySelector("#gameDocument") != null));
            await checkEditing("#gameDocument");
            const round = games[index === 1 ? "lock" : "signalMixing"].levels[0]!.rounds[0]!;
            const descriptions = getGameMeterDescriptions(index === 1 ? "lock" : "signalMixing", round);
            assert.deepEqual(await evaluate(() => [...document.querySelectorAll(".gameMeterViewport .meterHelp button")]
                .map((button) => button.getAttribute("aria-label"))),
            round.labels.filter((_, index) => descriptions[index] != null).map((label) => `About ${label}`));
            assert.equal(await evaluate(() => document.querySelectorAll(".meterTooltip").length), 0,
                "Unused tooltips should not be mounted");
            if (descriptions.some((description) => description != null)) {
                const hoverDelay = await evaluate(async () => {
                    const help = document.querySelector<HTMLElement>(".gameMeterViewport .meterHelp")!;
                    const opened = new Promise<number>((resolve) => {
                        const observer = new MutationObserver(() => {
                            if (help.querySelector(".meterTooltip:popover-open")) {
                                observer.disconnect();
                                resolve(performance.now());
                            }
                        });
                        observer.observe(help, {childList: true});
                    });
                    const start = performance.now();
                    help.dispatchEvent(new PointerEvent("pointerover", {bubbles: true}));
                    const delay = await opened - start;
                    help.dispatchEvent(new PointerEvent("pointerout", {bubbles: true, relatedTarget: document.body}));
                    return delay;
                });
                assert.ok(hoverDelay >= 240, "Meter help waits 250ms before opening on hover");
                await evaluate(() => document.querySelector<HTMLButtonElement>(".gameMeterViewport .meterHelp button")!.focus());
                await waitFor(() => evaluate(() => document.querySelector(".meterTooltip:popover-open") != null));
                assert.ok(await evaluate(() => document.querySelector(".meterTooltip:popover-open")!.textContent!.length > 15));
                const closedAt = performance.now();
                await evaluate(() => document.querySelector<HTMLTextAreaElement>("#gameDocument")!.focus());
                await waitFor(() => evaluate(() => document.querySelector(".meterTooltip:popover-open") == null));
                assert.equal(await evaluate(() => document.querySelectorAll(".meterTooltip").length), 1,
                    "A closing tooltip stays mounted for its exit transition");
                await waitFor(() => evaluate(() => document.querySelector(".meterTooltip") == null));
                assert.ok(performance.now() - closedAt >= 1900, "Closed tooltips remain mounted for two seconds");
                const iconPosition = await evaluate(() => {
                    const rect = document.querySelector(".gameMeterViewport .meterHelp button")!.getBoundingClientRect();
                    return {x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2)};
                });
                contents.sendInputEvent({type: "mouseMove", ...iconPosition});
                await setTimeout(200);
                const hoverBackground = await evaluate(() => {
                    const button = document.querySelector(".gameMeterViewport .meterHelp button")!;
                    const expected = document.createElement("span");
                    expected.style.color = getComputedStyle(button.querySelector("svg")!).fill;
                    expected.style.background = "color-mix(in srgb, currentColor 12%, transparent)";
                    document.body.append(expected);
                    const result = {actual: getComputedStyle(button).backgroundColor, expected: getComputedStyle(expected).backgroundColor};
                    expected.remove();
                    return result;
                });
                contents.sendInputEvent({type: "mouseMove", x: 0, y: 0});
                assert.equal(hoverBackground.actual, hoverBackground.expected, "Info icon hover overrides the global button hover style");
            }
            const meterLayout = () => evaluate(() => {
                const viewport = document.querySelector<HTMLElement>(".gameMeterViewport")!;
                const timing = document.querySelector<HTMLElement>(".gameTiming")!;
                return {
                    headings: [...viewport.querySelectorAll("h2")].map((heading) => heading.textContent),
                    headingGaps: [...viewport.querySelectorAll("h2")].map((heading) => {
                        const title = heading.firstElementChild!.getBoundingClientRect();
                        const divider = heading.dataset.startRisks === "true"
                            ? parseFloat(getComputedStyle(viewport).getPropertyValue("--game-meter-inset")) + 1 : 0;
                        return [title.top - heading.getBoundingClientRect().top - divider,
                            heading.getBoundingClientRect().bottom - title.bottom];
                    }),
                    gaps: [...viewport.querySelectorAll(".meterGap")].map((gap) => gap.getBoundingClientRect().height),
                    labelGaps: [...viewport.querySelectorAll(".gameMeter")].map((meter) =>
                        meter.lastElementChild!.getBoundingClientRect().top - meter.firstElementChild!.getBoundingClientRect().bottom),
                    timingGaps: [timing.firstElementChild!.getBoundingClientRect().top - timing.getBoundingClientRect().top - 1,
                        timing.getBoundingClientRect().bottom - timing.firstElementChild!.getBoundingClientRect().bottom],
                    scrolls: viewport.scrollHeight > viewport.clientHeight
                };
            });
            const roomy = await meterLayout();
            assert.deepEqual(roomy.headings, index === 1 ? ["Goals"] : ["Goals", "Risks"]);
            assert.ok(roomy.gaps.every((gap) => gap >= 11 && gap <= 24));
            if (index === 1)
                assert.ok(roomy.gaps.every((gap) => gap === 24), "Keep full meter spacing when the content fits");
            window.setSize(1380, 560);
            await waitFor(async () => (await meterLayout()).labelGaps.every((gap) => gap === 5));
            const compact = await meterLayout();
            assert.ok(compact.gaps.every((gap) => gap === 11), "Leave extra separation between compact meters");
            assert.ok(compact.headingGaps.flat().every((gap) => gap === 16), "Both section headings use the same minimum spacing");
            assert.ok(compact.timingGaps.every((gap) => gap === 14), "Reduce duration padding symmetrically");
            assert.equal(compact.scrolls, true, "Scroll meters once the gaps reach their minimum");
            window.setSize(1380, 900);
            await waitFor(async () => (await meterLayout()).gaps.every((gap, index) => Math.abs(gap - roomy.gaps[index]!) < 1));
            await waitFor(() => evaluations.at(-1)?.input.document.includes("Hello beautiful 🐈 world"));
            await click(".backButton");
            await click(".levelPicker .backButton");
            await waitFor(() => evaluate(() => document.querySelector(".gameChoice") != null));
        }
        // Finish a level, replay it with shorter answers, and keep another model's score separate.
        await click(".gameChoice:first-child");
        await click(".levelPicker .level:first-child");
        const finishLevel = async (text: string) => {
            for (let round = 0; round < 3; round++) {
                await select("#gameDocument", 0, 32_000);
                await insert(text);
                await waitFor(() => evaluate(() => !document.querySelector<HTMLButtonElement>(".nextButton")?.disabled));
                await waitFor(() => evaluate(() => document.querySelector<HTMLElement>(".roundFeedback")?.dataset.visible === "true"));
                assert.doesNotMatch(await evaluate(() => document.querySelector(".roundFeedback")!.textContent!), /[.!?]/);
                await evaluate(() => delete document.documentElement.dataset.roundMotion);
                await advance();
                await waitFor(() => evaluate((round) => (round === 2 ? document.querySelector(".levelResult") != null :
                    document.querySelector(".roundCount")?.textContent?.includes(`Round ${round + 2} /`) === true), round));
                await waitFor(() => evaluate(() => document.documentElement.dataset.roundMotion != null));
                assert.deepEqual(JSON.parse(await evaluate(() => document.documentElement.dataset.roundMotion!)), round === 2 ? [
                    ["roundEnter", 280, "cubic-bezier(0.4, 0, 0.2, 1)", 24, 0.97],
                    ["roundLeave", 240, "ease-in", -24, 0.97]
                ] : [
                    ["appModeEnter", 240, "cubic-bezier(0.4, 0, 0.2, 1)", 24, 1],
                    ["appModeLeave", 220, "cubic-bezier(0.4, 0, 0.2, 1)", -24, 1]
                ]);
                await waitFor(() => evaluate(() => !document.documentElement.matches(":active-view-transition")));
            }
            await waitFor(() => evaluate(() => document.querySelector(".levelResult .newBest") != null));
            await waitFor(() => state.scores.length > 0);
        };
        await select("#gameDocument", 0, 32_000);
        await insert("valid answer");
        await waitFor(() => evaluate(() => !document.querySelector<HTMLButtonElement>(".nextButton")?.disabled));
        assert.equal(await evaluate(() => document.querySelector(".nextButton")!.getAttribute("aria-keyshortcuts")),
            testPlatform === "darwin" ? "Meta+Enter" : "Control+Enter");
        assert.equal(await evaluate(() => document.querySelector(".nextButton kbd")!.textContent),
            testPlatform === "darwin" ? "⌘↵" : "Ctrl↵");
        const roundHeading = await evaluate(() => document.querySelector(".roundCount")!.textContent);
        await advance(undefined, true);
        await advance(testPlatform === "darwin" ? 2 : 4);
        await evaluate((platform) => {
            const modifier = platform === "darwin" ? {metaKey: true} : {ctrlKey: true};
            document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Enter", ...modifier, isComposing: true, bubbles: true, cancelable: true
            }));
        }, testPlatform);
        await click(".howToPlay");
        await waitFor(() => evaluate(() => document.querySelector<HTMLDialogElement>(".gameHelpDialog")!.open));
        await advance();
        assert.equal(await evaluate(() => document.querySelector(".roundCount")!.textContent), roundHeading);
        await evaluate(() => document.querySelector<HTMLDialogElement>(".gameHelpDialog")!.close());
        await click(".modelButton");
        await advance();
        assert.equal(await evaluate(() => document.querySelector(".roundCount")!.textContent), roundHeading);
        await evaluate(() => document.querySelector<HTMLElement>("#modelsPopover")!.hidePopover());
        await select("#gameDocument", 0, 32_000);
        await insert("invalid");
        assert.equal(await evaluate(() => document.querySelector<HTMLButtonElement>(".nextButton")?.disabled), true);
        assert.equal(await evaluate(() => document.querySelector<HTMLElement>(".roundFeedback")?.dataset.visible), "false");
        assert.ok(await evaluate(() => document.querySelector(".roundFeedback")!.textContent!.length > 0), "Feedback stays mounted to fade out");
        await advance();
        assert.equal((await read("#gameDocument")).value, "invalid");
        assert.equal(await evaluate(() => document.querySelector(".roundCount")!.textContent), roundHeading);
        await finishLevel("A longer successful answer");
        const firstScore = state.scores[0]!.best;
        await evaluate(() => [...document.querySelectorAll<HTMLButtonElement>(".resultActions button")]
            .find((button) => button.textContent === "Play again")!.click());
        await finishLevel("Short answer");
        assert.equal(state.scores.length, 1);
        assert.ok(state.scores[0]!.best > firstScore);
        await evaluate(() => [...document.querySelectorAll<HTMLButtonElement>(".resultActions button")]
            .find((button) => button.textContent === "My scores")!.click());
        assert.equal(await evaluate(() => document.querySelectorAll(".myLevel tbody tr").length), 22);
        await click(".myLevel .backButton");
        await click(".gameChoice:first-child");
        await click(".levelPicker .level:first-child");
        await evaluate(() => [...document.querySelectorAll<HTMLButtonElement>(".resultActions button")]
            .find((button) => button.textContent === "Play again")!.click());
        await insert("A completed first round");
        await waitFor(() => evaluate(() => !document.querySelector<HTMLButtonElement>(".nextButton")?.disabled));
        await click(".nextButton");
        await waitFor(() => evaluate(() => document.querySelector(".roundCount")?.textContent?.includes("Round 2 /")));
        await waitFor(() => evaluate(() => !document.documentElement.matches(":active-view-transition")));
        await insert("Keep my unfinished round");
        const chooseSecondModel = async () => {
            if (!await evaluate(() => document.querySelector("#modelsPopover")!.matches(":popover-open")))
                await click(".modelButton");
            await evaluate(() => [...document.querySelectorAll<HTMLButtonElement>("#modelsPopover button")]
                .find((button) => button.getAttribute("aria-label") === "Load Qwen 3.5 2B Q4_K_M")!.click());
            await waitFor(() => evaluate(() => document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open));
        };
        await chooseSecondModel();
        assert.equal(await evaluate(() => document.querySelector(".switchModelDialog p")!.textContent),
            "Switching a model now will stop the current play round. Are you sure?");
        await click(".switchModelDialog button:first-child");
        await waitFor(() => evaluate(() => !document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open));
        assert.equal(loadCount, 0);
        assert.equal((await read("#gameDocument")).value, "Keep my unfinished round");
        // Canceling the native file picker does not interrupt a round. Choosing a file uses the same confirmation.
        await click(".modelButton");
        const chooseFile = () => evaluate(() => [...document.querySelectorAll<HTMLButtonElement>("#modelsPopover button")]
            .find((button) => button.textContent?.includes("Select model file"))!.click());
        await chooseFile();
        await setTimeout(150);
        assert.equal(await evaluate(() => document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open), false);
        assert.equal(loadCount, 0);
        selectedFile = "qwen-2b";
        await chooseFile();
        await waitFor(() => evaluate(() => document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open));
        await click(".switchModelDialog button:first-child");
        await waitFor(() => evaluate(() => !document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open));
        assert.equal(loadCount, 0);
        await chooseSecondModel();
        await click(".switchModelDialog .confirmSwitch");
        await waitFor(() => state.loadedModelId === "qwen-2b");
        await waitFor(() => evaluate(() => document.querySelector(".levelPicker") != null));
        assert.equal(loadCount, 1);
        // Completed rounds remain attached to the original model; only the interrupted draft is cleared.
        for (const id of ["qwen-0.8b", "qwen-2b"]) {
            const model = models.find((model) => model.id === id)!;
            await click(".modelButton");
            await evaluate((name) => [...document.querySelectorAll<HTMLButtonElement>("#modelsPopover button")]
                .find((button) => button.getAttribute("aria-label") === `Load ${name}`)!.click(),
            `${model.name} ${model.parameters} ${model.quant}`);
            await waitFor(() => state.loadedModelId === model.id);
            assert.equal(await evaluate(() => document.querySelector<HTMLDialogElement>(".switchModelDialog")!.open), false);
            if (model.id === "qwen-0.8b") {
                await click(".levelPicker .level:first-child");
                await waitFor(() => evaluate(() => document.querySelector(".roundCount")?.textContent?.includes("Round 2 /")));
                assert.equal((await read("#gameDocument")).value, "");
                await click(".backButton");
            }
        }
        await click(".levelPicker .level:first-child");
        await waitFor(() => evaluate(() => document.querySelector("#gameDocument") != null));
        assert.equal((await read("#gameDocument")).value, "");
        await finishLevel("Another model's answer");
        await waitFor(() => state.scores.length === 2);
        assert.equal(state.scores[1]!.modelId, "qwen-2b");
        assert.equal(await evaluate(() => document.querySelector(".nextLevel")!.getAttribute("aria-keyshortcuts")),
            testPlatform === "darwin" ? "Meta+Enter" : "Control+Enter");
        await advance(undefined, true);
        assert.ok(await evaluate(() => document.querySelector(".levelResult") != null));
        await advance();
        await waitFor(() => evaluate(() => document.querySelector(".roundCount")?.textContent?.includes("Level 2 · Round 1 /")));
        assert.equal((await read("#gameDocument")).value, "");
        console.log(`${testPlatform}: shortcut advancement, hints, disabled results, repeats, composition, and overlays passed`);
        await click(".backButton");
        const base = {...state.scores[1]!, latest: 1200, best: 2500, completedAt: "2026-09-01T00:00:00Z"};
        const localName = "My very long custom model filename with a quantization suffix Q8_0.gguf";
        state = {...state, scores: [
            base,
            {...base, modelId: "qwen-0.8b", modelName: "Qwen 3.5 0.8B Q8_0", latest: 2000, completedAt: "2026-09-25T00:00:00Z"},
            {...base, modelId: "qwen-0.8b", modelName: "Qwen 3.5 0.8B Q8_0", level: 2},
            {...base, modelId: "gemma-q8", modelName: "Gemma 4 5B E2B Q8_0", level: 2, completedAt: "2026-09-24T00:00:00Z"},
            {...base, game: "signalMixing", level: 3},
            {...base, modelId: `local:${"a".repeat(64)}`, modelName: localName, level: 4}
        ]};
        await rpc.updateState(state);
        await waitFor(() => evaluate(() => document.querySelector(".level:first-child .levelScore strong")?.textContent ===
            (1200).toLocaleString()));
        assert.equal(await evaluate(() => document.querySelector(".level:first-child .levelScore > span")!.textContent), "Last score");
        assert.equal(await evaluate(() => document.querySelector(".level:nth-child(2) .modelName")!.textContent), "Gemma 4 5B E2B Q8_0");
        assert.equal(await evaluate(() => document.querySelector(".level:nth-child(2) .levelScore > span")!.textContent), "Played with");
        assert.match(await evaluate(() => document.querySelector(".level:nth-child(3) .playAction")!.textContent!), /^Play/);
        assert.equal(await evaluate(() => document.querySelector(".level:nth-child(4) .modelName")!.getAttribute("title")), localName);
        await click(".modelButton");
        await evaluate(() => [...document.querySelectorAll<HTMLButtonElement>("#modelsPopover button")]
            .find((button) => button.getAttribute("aria-label") === "Load Qwen 3.5 0.8B Q8_0")!.click());
        await waitFor(() => evaluate(() => document.querySelector(".level:first-child .levelScore strong")?.textContent ===
            (2000).toLocaleString()));
        await waitFor(() => evaluate(() => document.querySelector(".level:nth-child(2) .levelScore > span")?.textContent === "Last score"));
        await click(".level:nth-child(2) .levelScore");
        await waitFor(() => evaluate(() => document.querySelector(".roundCount")?.textContent?.includes("Level 2 · Round 1 /")));
        console.log("Level rows: latest score over best, current-model priority, recent other model, local names, and clickable score blocks passed");
        console.log("Game flow: feedback, transitions, completion, replay, model-switch confirmation/cancellation, file selection, and separate scores passed");
        assert.deepEqual(errors, [], "Renderer errors");
    } catch (error) {
        console.error(error);
        exitCode = 1;
    } finally {
        window.destroy();
        try {
            await rm(profile, {recursive: true, force: true, maxRetries: 5});
        } finally {
            app.exit(exitCode);
        }
    }
});
