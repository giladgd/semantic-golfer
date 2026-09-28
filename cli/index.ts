#!/usr/bin/env node
import {spawn, type ChildProcess} from "node:child_process";
import {once} from "node:events";
import {createRequire} from "node:module";
import {constants} from "node:os";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {getLlama, LlamaLogLevel} from "node-llama-cpp";
import {prepareRuntime, prepareUpdate, savedUpdate} from "./prepareUpdate.ts";

try {
    const llama = await getLlama({logLevel: LlamaLogLevel.error});
    await llama.dispose();

    if (process.env.SEMANTIC_GOLFER_PREPARE_ONLY === "1")
        process.exit(0);

    let root = fileURLToPath(new URL("../", import.meta.url));
    const children = new Set<ChildProcess>();
    let stopping = false;
    const stop = () => {
        stopping = true;
        children.forEach((child) => child.kill());
    };
    const interrupt = () => {
        stopping = true;
        children.forEach((child) => child.kill("SIGINT"));
    };
    process.once("exit", stop);
    process.once("SIGINT", interrupt);
    process.once("SIGTERM", stop);
    process.once("SIGHUP", stop);
    try {
        const updatedRoot = await savedUpdate(root);
        if (updatedRoot) {
            try {
                await prepareRuntime(updatedRoot, new AbortController().signal, children);
                root = updatedRoot;
            } catch (error) {
                console.error("Could not open the saved update; opening the installed version:", error);
            }
        }
        while (!stopping) {
            const electron: string = createRequire(path.join(root, "package.json"))("electron");
            const child = spawn(electron, [root, ...process.argv.slice(2)], {
                stdio: ["inherit", "inherit", "inherit", "ipc"],
                env: {...process.env, SEMANTIC_GOLFER_LAUNCHER: "1"}
            });
            children.add(child);
            const controller = new AbortController();
            let nextRoot: string | undefined;
            let updating = false;
            child.on("message", (message) => {
                if (updating || message == null || typeof message !== "object" || !("type" in message) ||
                    message.type !== "semantic-golfer:update" || !("version" in message) || typeof message.version !== "string")
                    return;
                updating = true;
                void prepareUpdate(message.version, controller.signal, children).then((updatedRoot) => {
                    if (controller.signal.aborted || !child.connected)
                        return;
                    nextRoot = updatedRoot;
                    child.send({type: "semantic-golfer:update-ready"}, (error) => {
                        if (error)
                            nextRoot = undefined;
                    });
                })
                    .catch((error) => {
                        updating = false;
                        if (!controller.signal.aborted && child.connected)
                            child.send({type: "semantic-golfer:update-error", error: String(error)}, () => {});
                    });
            });
            try {
                const [code, signal] = await once(child, "exit") as [number | null, NodeJS.Signals | null];
                if (nextRoot && code === 0 && !stopping) {
                    root = nextRoot;
                    continue;
                }
                process.exitCode = code ?? (signal == null ? 1 : 128 + constants.signals[signal]);
                break;
            } finally {
                controller.abort();
                children.delete(child);
            }
        }
    } finally {
        process.off("exit", stop);
        process.off("SIGINT", interrupt);
        process.off("SIGTERM", stop);
        process.off("SIGHUP", stop);
        stop();
    }
} catch (error) {
    console.error("Unable to start Semantic Golfer:", error);
    process.exitCode = 1;
}
