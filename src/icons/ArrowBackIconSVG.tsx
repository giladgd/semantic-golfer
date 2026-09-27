import type {SVGProps} from "react";

export function ArrowBackIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
