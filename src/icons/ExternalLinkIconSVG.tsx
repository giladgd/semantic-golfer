import type {SVGProps} from "react";

// ic:round-arrow-outward, Apache-2.0. See LICENSES.md.
export function ExternalLinkIconSVG(props: SVGProps<SVGSVGElement>) {
    return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
        <path fill="currentColor" d="M6 7c0 .55.45 1 1 1h7.59l-8.88 8.88a.996.996 0 1 0 1.41 1.41L16 9.41V17c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1" />
    </svg>;
}
