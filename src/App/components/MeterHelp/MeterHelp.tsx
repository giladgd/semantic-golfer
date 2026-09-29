import {useEffect, useId, useRef, useState} from "react";
import {flushSync} from "react-dom";
import {LongTimeout} from "lifecycle-utils";
import {InfoIconSVG} from "../../../icons/InfoIconSVG.tsx";
import "./MeterHelp.css";

export function MeterHelp({label, description}: {label: string, description: string}) {
    const id = useId();
    const anchorName = `--meter-help-${id.replaceAll(":", "")}`;
    const tooltip = useRef<HTMLSpanElement>(null);
    const hoverDelay = useRef<LongTimeout>(null);
    const unmountDelay = useRef<LongTimeout>(null);
    const [mounted, setMounted] = useState(false);
    const show = () => {
        hoverDelay.current?.dispose();
        unmountDelay.current?.dispose();
        if (tooltip.current == null)
            flushSync(() => setMounted(true));
        tooltip.current?.showPopover();
    };
    useEffect(() => () => {
        hoverDelay.current?.dispose();
        unmountDelay.current?.dispose();
    }, []);

    return <span
        className="meterHelp"
        onPointerEnter={() => {
            hoverDelay.current?.dispose();
            if (!tooltip.current?.matches(":popover-open"))
                hoverDelay.current = new LongTimeout(show, 250);
        }}
        onPointerLeave={(event) => {
            hoverDelay.current?.dispose();
            if (!event.currentTarget.matches(":focus-within"))
                tooltip.current?.hidePopover();
        }}
        onFocus={show}
        onBlur={(event) => {
            if (!event.currentTarget.matches(":hover"))
                tooltip.current?.hidePopover();
        }}
    >
        <button
            type="button"
            style={{anchorName}}
            aria-label={`About ${label}`}
            aria-description={description}
            aria-describedby={mounted ? id : undefined}
            popoverTarget={mounted ? id : undefined}
            popoverTargetAction="show"
            onClick={show}
        >
            <InfoIconSVG aria-hidden="true" />
        </button>
        {mounted && <span
            ref={tooltip}
            id={id}
            className="meterTooltip"
            style={{positionAnchor: anchorName}}
            role="tooltip"
            popover="auto"
            onToggle={(event) => {
                unmountDelay.current?.dispose();
                if (event.newState === "closed")
                    unmountDelay.current = new LongTimeout(() => setMounted(false), 2000);
            }}
        >{description}
        </span>}
    </span>;
}
