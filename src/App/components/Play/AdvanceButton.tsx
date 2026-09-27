import {useEffect, useRef, type ComponentProps} from "react";
import "./AdvanceButton.css";

export function AdvanceButton({children, className = "", ...props}: ComponentProps<"button">) {
    const button = useRef<HTMLButtonElement>(null);
    const isMac = window.platform === "darwin";
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Enter" || event.isComposing || event.defaultPrevented ||
                event.altKey || event.shiftKey || (isMac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) ||
                document.querySelector(":modal, :popover-open") != null || button.current?.closest("[inert]") != null)
                return;
            event.preventDefault();
            if (!event.repeat)
                button.current?.click(); // Disabled buttons ignore clicks, including while a decision is pending.
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMac]);

    return <button {...props} ref={button} className={`advanceButton ${className}`} aria-keyshortcuts={isMac ? "Meta+Enter" : "Control+Enter"}>
        {children}<kbd aria-hidden="true">{isMac ? "⌘" : "Ctrl"}<span>↵</span></kbd>
    </button>;
}
