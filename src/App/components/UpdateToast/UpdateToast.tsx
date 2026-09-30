import {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {electronLlmRpc} from "../../../rpc/llmRpc.ts";
import "./UpdateToast.css";
import type {AppUpdate} from "../../../../shared/appUpdate.ts";

export function UpdateToast({update}: {update?: AppUpdate}) {
    const element = useRef<HTMLElement>(null);
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const visible = update != null && !update.dismissed;
    useEffect(() => {
        if (!visible)
            return;
        // A popover outside the active modal is inert, even when it is visually on top.
        let dialogs: HTMLDialogElement[] = [];
        const syncContainer = (records: MutationRecord[]) => {
            dialogs = dialogs.filter((dialog) => dialog.isConnected && dialog.matches(":modal"));
            for (const {type, target} of records) {
                if (type === "attributes" && target instanceof HTMLDialogElement && target.matches(":modal")) {
                    dialogs = dialogs.filter((dialog) => dialog !== target);
                    dialogs.push(target);
                }
            }
            for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog:modal")) {
                if (!dialogs.includes(dialog))
                    dialogs.push(dialog);
            }
            setContainer(dialogs.at(-1) ?? document.body);
        };
        const observer = new MutationObserver(syncContainer);
        observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ["open"]});
        syncContainer([]);
        return () => observer.disconnect();
    }, [visible]);
    useEffect(() => {
        if (visible)
            element.current?.showPopover();
        else
            element.current?.hidePopover();
    }, [visible, container]);
    if (!update || !container)
        return null;
    const busy = update.status === "downloading" || update.status === "installing";
    const title = update.status === "checking" ? "Checking for updates…" : update.status === "current" ? "You’re up to date" :
        update.status === "installing" ? "Restarting to update…" : update.version ? `${update.version} is available` : "Could not check for updates";

    return createPortal(
        <aside className="updateToast" popover="manual" ref={element} aria-label="App update">
            <div className="updateMessage" role="status">
                <strong>{title}</strong>
                {(update.error ?? update.manual) && <span>{update.error ?? update.manual}</span>}
            </div>
            <button className="dismissUpdate" aria-label="Dismiss update notification" onClick={() => void electronLlmRpc.dismissUpdate()}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M7 17 17 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {update.version && <button className="installUpdate" disabled={busy} onClick={() => void electronLlmRpc.installUpdate()}>
                {busy && <progress aria-label="Update progress" max={1} value={update.progress} />}
                <span>{update.status === "installing" ? "Restarting…" : busy ?
                    `Updating${update.progress == null ? "…" : ` ${Math.round(update.progress * 100)}%`}` :
                    update.manual ? "Download update" : update.status === "error" ? "Retry update" : "Update"}
                </span>
            </button>}
            {!update.version && update.status === "error" && <button className="installUpdate" onClick={() => void electronLlmRpc.checkForUpdates()}>Try again</button>}
        </aside>, container
    );
}
