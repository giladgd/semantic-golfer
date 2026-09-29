import {useEffect, useRef, useState} from "react";
import {LongTimeout} from "lifecycle-utils";
import {CheckIconSVG} from "../../src/icons/CheckIconSVG.tsx";
import "./InstallCommand.css";

const command = "npx -y semantic-golfer@latest";

export function InstallCommand() {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const code = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!copied)
            return;
        const timer = new LongTimeout(() => setCopied(false), 3_000);
        return () => timer.dispose();
    }, [copied]);

    return <div className="installCommand">
        <div className="commandBox">
            <span className="prompt" aria-hidden="true">$</span><code ref={code}><span className="commandName">npx</span>{" -y "}<span className="packageName">semantic-golfer@latest</span></code>
            <button
                aria-label={copied ? "Command copied" : "Copy install command"}
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(command);
                        setCopied(true);
                        setFailed(false);
                    } catch {
                        const range = document.createRange();
                        range.selectNodeContents(code.current!);
                        window.getSelection()?.removeAllRanges();
                        window.getSelection()?.addRange(range);
                        setFailed(true);
                    }
                }}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" data-active={!copied}>
                    <rect x="8" y="8" width="12" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M15 5V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <CheckIconSVG data-active={copied} />
            </button>
            <span className="copyTooltip" role="status" data-visible={copied}>
                Copied! Now run it in your terminal
            </span>
        </div>
        <span className="commandStatus" role="status">{failed ? "Select and copy the command to run it." : "macOS · Windows · Linux"}
        </span>
        <a className="downloadLink" href="https://github.com/giladgd/semantic-golfer/releases/latest">Or download the desktop app <span aria-hidden="true">↗</span></a>
    </div>;
}
