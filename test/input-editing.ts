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
    let state: LlmState = {...initialLlmState, loadedModelId: "qwen-0.8b",
        models: Object.fromEntries(models.map(({id}) => [id, {downloaded: true}]))};
    const rpc = createBirpc<{updateState: (state: LlmState) => void}>({
        getState: () => state,
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
            const answers = [request.input, ...request.additionalInputs ?? []].map((input, index): DecisionResult["answer"] => {
                if (input.type === "noul")
                    return {type: "noul", value: input.document.includes("invalid") ? 0.1 : 0.8};
                const probabilities = request.additionalInputs?.length && input.type === "choice"
                    ? (index < 2 ? [0.1, 0.9] : [0.9, 0.1])
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
        await waitFor(() => evaluate(() => document.querySelector<HTMLElement>(".mainContent")?.inert === false));
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
        }
        await evaluate(() => {
            for (const game of ["lock", "camouflage"])
                localStorage.setItem(`game-help:${game}`, "seen");
        });
        await click(".topBar nav button:first-child");
        await waitFor(() => evaluate(() => document.querySelector(".gameChoice") != null));
        await waitFor(() => evaluate(() => document.documentElement.dataset.modeMotion === "[-24,24]"));
        for (const index of [1, 2]) {
            await click(`.gameChoice:nth-child(${index})`);
            await waitFor(() => evaluate(() => document.querySelector(".levelPicker .level") != null));
            await click(".levelPicker .level:first-child");
            await waitFor(() => evaluate(() => document.querySelector("#gameDocument") != null));
            await checkEditing("#gameDocument");
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
        await evaluate(() => {
            const modifier = window.platform === "darwin" ? {metaKey: true} : {ctrlKey: true};
            document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Enter", ...modifier, isComposing: true, bubbles: true, cancelable: true
            }));
        });
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
            {...base, game: "camouflage", level: 3},
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
