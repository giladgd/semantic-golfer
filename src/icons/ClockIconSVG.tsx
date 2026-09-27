import type {SVGProps} from "react";

export function ClockIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
