import type {SVGProps} from "react";

export function AddIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>;
}
