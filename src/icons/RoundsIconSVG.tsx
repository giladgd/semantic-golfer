import type {SVGProps} from "react";

export function RoundsIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
