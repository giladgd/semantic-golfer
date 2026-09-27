import type {SVGProps} from "react";

export function BlendIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="M21.97 12c0 3.31-2.69 6-6 6a5.93 5.93 0 0 1-4-1.54c1.23-1.09 2-2.69 2-4.46s-.77-3.37-2-4.46a5.93 5.93 0 0 1 4-1.54c3.31 0 6 2.69 6 6" />
            <path d="M13.97 12c0 1.77-.77 3.37-2 4.46a5.93 5.93 0 0 1-4 1.54c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.54 0 2.94.58 4 1.54c1.23 1.09 2 2.69 2 4.46" />
        </g>
    </svg>;
}
